import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings, Variables, TelegramUpdate } from './types'
import { TelegramClient } from './services/telegram'
import { AuthService } from './services/auth'
import { ConversationManager } from './services/conversation'
import { AiEngine } from './services/ai'
import { RateLimiter } from './middleware/rate-limiter'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Enable CORS
app.use('*', cors())

// Health check
app.get('/', (c) => {
  return c.json({
    service: 'backend-telegram',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// ═══════════════════════════════════════════════════
// TELEGRAM WEBHOOK HANDLER
// ═══════════════════════════════════════════════════
app.post('/webhook/:secret?', async (c) => {
  const secretParam = c.req.param('secret')
  const secretHeader = c.req.header('X-Telegram-Bot-Api-Secret-Token')
  const expectedSecret = c.env.WEBHOOK_SECRET

  // Verify webhook secret from URL param or header
  if (expectedSecret && secretParam !== expectedSecret && secretHeader !== expectedSecret) {
    console.warn('Unauthorized webhook request rejected')
    return c.json({ message: 'Unauthorized' }, 401)
  }

  let update: TelegramUpdate
  try {
    update = await c.req.json()
  } catch (e) {
    return c.json({ message: 'Invalid JSON payload' }, 400)
  }

  const telegramClient = new TelegramClient(c.env.TELEGRAM_BOT_TOKEN)
  const authService = new AuthService(c.env)
  const conversationManager = new ConversationManager(c.env.KV)
  const rateLimiter = new RateLimiter(c.env.KV)
  const aiEngine = new AiEngine(c.env, telegramClient)

  // ─── Case 1: Callback Query (Inline Keyboard confirmation) ───
  if (update.callback_query) {
    const cb = update.callback_query
    const chatId = cb.message?.chat?.id
    const telegramUserId = cb.from.id
    const actionData = cb.data || ''

    if (chatId) {
      await telegramClient.answerCallbackQuery(cb.id)

      if (actionData === 'confirm_cancel') {
        await conversationManager.consumePendingConfirmation(chatId)
        await telegramClient.sendMessage(chatId, '❌ Action cancelled\\.')
        return c.json({ ok: true })
      }

      if (actionData === 'confirm_execute') {
        const pending = await conversationManager.consumePendingConfirmation(chatId)
        if (!pending) {
          await telegramClient.sendMessage(chatId, '⚠️ Confirmation expired or not found\\.')
          return c.json({ ok: true })
        }

        await telegramClient.sendChatAction(chatId, 'typing')
        // Send a confirmation command directly through AI tool executor
        const prompt = `User explicitly confirmed action: ${pending.description}. Execute tool "${pending.tool_name}" with parameters: ${JSON.stringify(pending.params)}.`
        
        const furbanUser = await authService.resolveTelegramUser(telegramUserId)
        if (!furbanUser || furbanUser.role !== 'admin') {
          await telegramClient.sendMessage(chatId, '🔒 You are not authorized to perform this admin action\\.')
          return c.json({ ok: true })
        }

        const state = await conversationManager.load(
          chatId,
          telegramUserId,
          furbanUser.uuid,
          furbanUser.role,
          c.env.ZANSLAB_DEFAULT_MODEL || 'an/claude-opus-5'
        )

        const { response, updatedState } = await aiEngine.processMessage(prompt, state)
        await conversationManager.save(chatId, updatedState)
        await telegramClient.sendMessage(chatId, response, { parseMode: 'MarkdownV2' })
        return c.json({ ok: true })
      }
    }

    return c.json({ ok: true })
  }

  // ─── Case 2: Message Update ───
  const message = update.message
  if (!message || !message.from) {
    return c.json({ ok: true })
  }

  const chatId = message.chat.id
  const telegramUserId = message.from.id
  const text = (message.text || message.caption || '').trim()

  // 1. Rate Limiting Check
  const msgRate = await rateLimiter.checkMessageLimit(telegramUserId)
  if (!msgRate.allowed) {
    await telegramClient.sendMessage(chatId, '⏳ You are sending messages too quickly\\. Please wait a moment\\.')
    return c.json({ ok: true })
  }

  // 2. Built-in Commands: /whoami, /start
  if (text === '/start') {
    const furbanUser = await authService.resolveTelegramUser(telegramUserId)
    if (!furbanUser) {
      await telegramClient.sendMessage(
        chatId,
        `👋 *Welcome to Furban Admin Assistant\\!*\n\n` +
        `🔒 Your Telegram account is not yet linked to Furban\\.\n\n` +
        `Your Telegram User ID is: \`${telegramUserId}\`\n\n` +
        `To link your account, go to the Furban Admin Dashboard:\n` +
        `👉 *Dashboard → Telegram Bot* and paste your User ID\\.`,
        { parseMode: 'MarkdownV2' }
      )
      return c.json({ ok: true })
    }

    await telegramClient.sendMessage(
      chatId,
      `👋 *Welcome back, ${TelegramClient.escapeMarkdownV2(furbanUser.nickname || furbanUser.email)}\\!*\n\n` +
      `You are linked as *${TelegramClient.escapeMarkdownV2(furbanUser.role)}*\\.\n` +
      `How can I help you manage Furban today?\n\n` +
      `Type \`/help\` to see common commands, or simply tell me what you want to do in English\\.`,
      { parseMode: 'MarkdownV2' }
    )
    return c.json({ ok: true })
  }

  if (text === '/whoami') {
    const furbanUser = await authService.resolveTelegramUser(telegramUserId)
    if (!furbanUser) {
      await telegramClient.sendMessage(
        chatId,
        `👤 *Telegram User ID:* \`${telegramUserId}\`\n` +
        `❌ *Furban Status:* Not linked\\.\n\n` +
        `Please link your account in the Furban admin dashboard\\.`,
        { parseMode: 'MarkdownV2' }
      )
    } else {
      await telegramClient.sendMessage(
        chatId,
        `👤 *Linked Account Info:*\n\n` +
        `• *Telegram ID:* \`${telegramUserId}\`\n` +
        `• *Furban Nickname:* ${TelegramClient.escapeMarkdownV2(furbanUser.nickname || 'None')}\n` +
        `• *Email:* ${TelegramClient.escapeMarkdownV2(furbanUser.email)}\n` +
        `• *Platform Role:* \`${TelegramClient.escapeMarkdownV2(furbanUser.role)}\`\n` +
        `• *UUID:* \`${furbanUser.uuid}\``,
        { parseMode: 'MarkdownV2' }
      )
    }
    return c.json({ ok: true })
  }

  if (text === '/help') {
    await telegramClient.sendMessage(
      chatId,
      `🛠 *Furban Admin Assistant Help*\n\n` +
      `*Commands:*\n` +
      `• \`/whoami\` — View your linked identity & Telegram ID\n` +
      `• \`/models\` — List available AI models\n` +
      `• \`/model <name>\` — Switch AI model \\(e\\.g\\. \`/model an/gpt-4o\`\\)\n` +
      `• \`/forget\` — Clear conversation context\n` +
      `• \`/help\` — Show this help message\n\n` +
      `*Example Natural Language Prompts:*\n` +
      `• _"List all published events"_\n` +
      `• _"Create a draft event named Furban Meet on Oct 20 10:00 to 17:00 at Braga CityWalk"_\n` +
      `• _"What is the revenue breakdown for the latest event?"_\n` +
      `• _"Add VIP tier for 150000 with quota 50"_\n` +
      `• _"Check in attendee EVT\\-0001"_\n` +
      `• _"List all users with publisher role"_\n` +
      `• _"Show check\\-in statistics for the event"_`,
      { parseMode: 'MarkdownV2' }
    )
    return c.json({ ok: true })
  }

  if (text === '/forget') {
    await conversationManager.clear(chatId)
    await telegramClient.sendMessage(chatId, '🧹 Conversation history cleared\\.')
    return c.json({ ok: true })
  }

  // 3. Model Switcher Commands: /models and /model
  if (text === '/models') {
    const models = await aiEngine.listAvailableModels()
    const currentModel = await conversationManager.getActiveModel(chatId, c.env.ZANSLAB_DEFAULT_MODEL || 'an/claude-opus-5')
    
    let msg = `🤖 *Available ZansLab AI Models:*\n\n`
    for (const m of models) {
      const isCurrent = m.id === currentModel
      msg += `• \`${TelegramClient.escapeMarkdownV2(m.id)}\` ${isCurrent ? '⭐ _(Active)_' : ''}\n`
    }
    msg += `\nTo switch model, send: \`/model <model_id>\``
    await telegramClient.sendMessage(chatId, msg, { parseMode: 'MarkdownV2' })
    return c.json({ ok: true })
  }

  if (text.startsWith('/model')) {
    const parts = text.split(/\s+/)
    if (parts.length < 2) {
      const currentModel = await conversationManager.getActiveModel(chatId, c.env.ZANSLAB_DEFAULT_MODEL || 'an/claude-opus-5')
      await telegramClient.sendMessage(
        chatId,
        `Current AI model: \`${TelegramClient.escapeMarkdownV2(currentModel)}\`\n\nTo switch, type: \`/model <model_id>\` \\(e\\.g\\. \`/model an/gpt-4o\`\\)\nor type \`/models\` to view available options\\.`,
        { parseMode: 'MarkdownV2' }
      )
      return c.json({ ok: true })
    }

    const requestedModel = parts[1].trim()
    await conversationManager.setActiveModel(chatId, requestedModel)
    await telegramClient.sendMessage(
      chatId,
      `✅ Active AI model set to: \`${TelegramClient.escapeMarkdownV2(requestedModel)}\``,
      { parseMode: 'MarkdownV2' }
    )
    return c.json({ ok: true })
  }

  // 4. Resolve Authorization: Must be linked Furban Admin
  const furbanUser = await authService.resolveTelegramUser(telegramUserId)
  if (!furbanUser) {
    await telegramClient.sendMessage(
      chatId,
      `🔒 *Access Restricted*\n\n` +
      `Your Telegram account is not linked to an admin account on Furban\\.\n` +
      `Your Telegram ID is: \`${telegramUserId}\`\n\n` +
      `Please link your account in the Furban Admin Dashboard to proceed\\.`,
      { parseMode: 'MarkdownV2' }
    )
    return c.json({ ok: true })
  }

  if (furbanUser.role !== 'admin') {
    await telegramClient.sendMessage(
      chatId,
      `🔒 *Unauthorized*\n\n` +
      `Your account (${TelegramClient.escapeMarkdownV2(furbanUser.email)}) has role *${TelegramClient.escapeMarkdownV2(furbanUser.role)}*\\. ` +
      `Only platform administrators can use this assistant\\.`,
      { parseMode: 'MarkdownV2' }
    )
    return c.json({ ok: true })
  }

  // 5. Handle Photos
  let photoContext: { file_id: string; file_size?: number } | undefined
  if (message.photo && message.photo.length > 0) {
    // Pick the highest resolution photo
    const largestPhoto = message.photo.reduce((prev, curr) => (curr.width > prev.width ? curr : prev), message.photo[0])
    photoContext = {
      file_id: largestPhoto.file_id,
      file_size: largestPhoto.file_size,
    }

    // If there's no caption, store photo in context and wait for user's prompt
    if (!text) {
      await conversationManager.setPhotoContext(chatId, photoContext)
      await telegramClient.sendMessage(
        chatId,
        `📸 *Photo received\\!*\n\nWhat would you like to do with this image? You can say:\n` +
        `• _"Use this as banner for event <Name>"_\n` +
        `• _"Create a new event with this banner"_`,
        { parseMode: 'MarkdownV2' }
      )
      return c.json({ ok: true })
    }
  } else {
    // Check if there was a previously uploaded photo context waiting for instruction
    const pendingPhoto = await conversationManager.consumePhotoContext(chatId)
    if (pendingPhoto) {
      photoContext = pendingPhoto
    }
  }

  if (!text && !photoContext) {
    return c.json({ ok: true })
  }

  // 6. Check AI Call Rate Limit (50 calls / hour)
  const aiRate = await rateLimiter.checkAiLimit(telegramUserId)
  if (!aiRate.allowed) {
    await telegramClient.sendMessage(chatId, '⚠️ Hourly AI assistant rate limit reached (50 queries/hour)\\. Please wait for the limit to reset\\.')
    return c.json({ ok: true })
  }

  // 7. Process Prompt through AI Engine
  await telegramClient.sendChatAction(chatId, 'typing')

  const state = await conversationManager.load(
    chatId,
    telegramUserId,
    furbanUser.uuid,
    furbanUser.role,
    c.env.ZANSLAB_DEFAULT_MODEL || 'an/claude-opus-5'
  )

  try {
    const { response, updatedState } = await aiEngine.processMessage(text || 'Create event with attached banner photo', state, photoContext)
    await conversationManager.save(chatId, updatedState)
    await telegramClient.sendMessage(chatId, response, { parseMode: 'MarkdownV2' })
  } catch (err: any) {
    console.error('Error processing message:', err)
    await telegramClient.sendMessage(
      chatId,
      `⚠️ *An error occurred:* ${TelegramClient.escapeMarkdownV2(err.message || 'Internal server error')}`,
      { parseMode: 'MarkdownV2' }
    )
  }

  return c.json({ ok: true })
})

// ═══════════════════════════════════════════════════
// DEVELOPMENT TESTING ENDPOINT (Local text testing)
// ═══════════════════════════════════════════════════
app.post('/api/test-message', async (c) => {
  const { message, telegramUserId = 123456789 } = await c.req.json()
  if (!message) return c.json({ error: 'message required' }, 400)

  const telegramClient = new TelegramClient(c.env.TELEGRAM_BOT_TOKEN || 'dummy')
  const conversationManager = new ConversationManager(c.env.KV)
  const aiEngine = new AiEngine(c.env, telegramClient)

  const state = await conversationManager.load(
    telegramUserId,
    telegramUserId,
    'test-admin-uuid',
    'admin',
    c.env.ZANSLAB_DEFAULT_MODEL || 'an/claude-opus-5'
  )

  const result = await aiEngine.processMessage(message, state)
  return c.json(result)
})

export default app

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
        await telegramClient.sendMessage(chatId, TelegramClient.markdownToHTML(response), { parseMode: 'HTML' })
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
    await telegramClient.sendMessage(chatId, '⏳ You are sending messages too quickly. Please wait a moment.', { parseMode: 'HTML' })
    return c.json({ ok: true })
  }

  // 2. Built-in Commands: /whoami, /start
  if (text === '/start') {
    const furbanUser = await authService.resolveTelegramUser(telegramUserId)
    if (!furbanUser) {
      await telegramClient.sendMessage(
        chatId,
        `👋 <b>Welcome to Furban Admin Assistant!</b>\n\n` +
        `🔒 Your Telegram account is not yet linked to Furban.\n\n` +
        `Your Telegram User ID is: <code>${telegramUserId}</code>\n\n` +
        `To link your account, go to the Furban Admin Dashboard:\n` +
        `👉 <b>Dashboard → Telegram Bot</b> and paste your User ID.`,
        { parseMode: 'HTML' }
      )
      return c.json({ ok: true })
    }

    await telegramClient.sendMessage(
      chatId,
      `👋 <b>Welcome back, ${TelegramClient.escapeHTML(furbanUser.nickname || furbanUser.email)}!</b>\n\n` +
      `You are linked as <b>${TelegramClient.escapeHTML(furbanUser.role)}</b>.\n` +
      `How can I help you manage Furban today?\n\n` +
      `Type <code>/help</code> to see common commands, or simply tell me what you want to do in English.`,
      { parseMode: 'HTML' }
    )
    return c.json({ ok: true })
  }

  if (text === '/whoami') {
    const furbanUser = await authService.resolveTelegramUser(telegramUserId)
    if (!furbanUser) {
      await telegramClient.sendMessage(
        chatId,
        `👤 <b>Telegram User ID:</b> <code>${telegramUserId}</code>\n` +
        `❌ <b>Furban Status:</b> Not linked.\n\n` +
        `Please link your account in the Furban admin dashboard.`,
        { parseMode: 'HTML' }
      )
    } else {
      await telegramClient.sendMessage(
        chatId,
        `👤 <b>Linked Account Info:</b>\n\n` +
        `• <b>Telegram ID:</b> <code>${telegramUserId}</code>\n` +
        `• <b>Furban Nickname:</b> ${TelegramClient.escapeHTML(furbanUser.nickname || 'None')}\n` +
        `• <b>Email:</b> ${TelegramClient.escapeHTML(furbanUser.email)}\n` +
        `• <b>Platform Role:</b> <code>${TelegramClient.escapeHTML(furbanUser.role)}</code>\n` +
        `• <b>UUID:</b> <code>${furbanUser.uuid}</code>`,
        { parseMode: 'HTML' }
      )
    }
    return c.json({ ok: true })
  }

  if (text === '/help') {
    await telegramClient.sendMessage(
      chatId,
      `🛠 <b>Furban Admin Assistant Help</b>\n\n` +
      `<b>Commands:</b>\n` +
      `• <code>/whoami</code> — View your linked identity & Telegram ID\n` +
      `• <code>/models</code> — List available AI models\n` +
      `• <code>/model &lt;name&gt;</code> — Switch AI model (e.g. <code>/model an/gpt-4o</code>)\n` +
      `• <code>/forget</code> — Clear conversation context\n` +
      `• <code>/help</code> — Show this help message\n\n` +
      `<b>Example Natural Language Prompts:</b>\n` +
      `• <i>"List all published events"</i>\n` +
      `• <i>"Create a draft event named Furban Meet on Oct 20 10:00 to 17:00 at Braga CityWalk"</i>\n` +
      `• <i>"What is the revenue breakdown for the latest event?"</i>\n` +
      `• <i>"Add VIP tier for 150000 with quota 50"</i>\n` +
      `• <i>"Check in attendee EVT-0001"</i>\n` +
      `• <i>"List all users with publisher role"</i>\n` +
      `• <i>"Show check-in statistics for the event"</i>`,
      { parseMode: 'HTML' }
    )
    return c.json({ ok: true })
  }

  if (text === '/forget') {
    await conversationManager.clear(chatId)
    await telegramClient.sendMessage(chatId, '🧹 Conversation history cleared.', { parseMode: 'HTML' })
    return c.json({ ok: true })
  }

  // 3. Model Switcher Commands: /models and /model
  if (text === '/models') {
    const models = await aiEngine.listAvailableModels()
    const currentModel = await conversationManager.getActiveModel(chatId, c.env.ZANSLAB_DEFAULT_MODEL || 'an/claude-opus-5')
    
    let msg = `🤖 <b>Available ZansLab AI Models:</b>\n\n`
    for (const m of models) {
      const isCurrent = m.id === currentModel
      msg += `• <code>${TelegramClient.escapeHTML(m.id)}</code> ${isCurrent ? '⭐ <i>(Active)</i>' : ''}\n`
    }
    msg += `\nTo switch model, send: <code>/model &lt;model_id&gt;</code>`
    await telegramClient.sendMessage(chatId, msg, { parseMode: 'HTML' })
    return c.json({ ok: true })
  }

  if (text.startsWith('/model')) {
    const parts = text.split(/\s+/)
    if (parts.length < 2) {
      const currentModel = await conversationManager.getActiveModel(chatId, c.env.ZANSLAB_DEFAULT_MODEL || 'an/claude-opus-5')
      await telegramClient.sendMessage(
        chatId,
        `Current AI model: <code>${TelegramClient.escapeHTML(currentModel)}</code>\n\nTo switch, type: <code>/model &lt;model_id&gt;</code> (e.g. <code>/model an/gpt-4o</code>)\nor type <code>/models</code> to view available options.`,
        { parseMode: 'HTML' }
      )
      return c.json({ ok: true })
    }

    const requestedModel = parts[1].trim()
    await conversationManager.setActiveModel(chatId, requestedModel)
    await telegramClient.sendMessage(
      chatId,
      `✅ Active AI model set to: <code>${TelegramClient.escapeHTML(requestedModel)}</code>`,
      { parseMode: 'HTML' }
    )
    return c.json({ ok: true })
  }

  // 4. Resolve Authorization: Must be linked Furban Admin
  const furbanUser = await authService.resolveTelegramUser(telegramUserId)
  if (!furbanUser) {
    await telegramClient.sendMessage(
      chatId,
      `🔒 <b>Access Restricted</b>\n\n` +
      `Your Telegram account is not linked to an admin account on Furban.\n` +
      `Your Telegram ID is: <code>${telegramUserId}</code>\n\n` +
      `Please link your account in the Furban Admin Dashboard to proceed.`,
      { parseMode: 'HTML' }
    )
    return c.json({ ok: true })
  }

  if (furbanUser.role !== 'admin') {
    await telegramClient.sendMessage(
      chatId,
      `🔒 <b>Unauthorized</b>\n\n` +
      `Your account (${TelegramClient.escapeHTML(furbanUser.email)}) has role <b>${TelegramClient.escapeHTML(furbanUser.role)}</b>. ` +
      `Only platform administrators can use this assistant.`,
      { parseMode: 'HTML' }
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
        `📸 <b>Photo received!</b>\n\nWhat would you like to do with this image? You can say:\n` +
        `• <i>"Use this as banner for event &lt;Name&gt;"</i>\n` +
        `• <i>"Create a new event with this banner"</i>`,
        { parseMode: 'HTML' }
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

  // 6. Check AI Call Rate Limit (200 calls / hour)
  const aiRate = await rateLimiter.checkAiLimit(telegramUserId)
  if (!aiRate.allowed) {
    await telegramClient.sendMessage(chatId, '⚠️ Hourly AI assistant rate limit reached (200 queries/hour). Please wait for the limit to reset.', { parseMode: 'HTML' })
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
    await telegramClient.sendMessage(chatId, TelegramClient.markdownToHTML(response), { parseMode: 'HTML' })
  } catch (err: any) {
    console.error('Error processing message:', err)
    await telegramClient.sendMessage(
      chatId,
      `⚠️ <b>An error occurred:</b> ${TelegramClient.escapeHTML(err.message || 'Internal server error')}`,
      { parseMode: 'HTML' }
    )
  }

  return c.json({ ok: true })
})

export default app

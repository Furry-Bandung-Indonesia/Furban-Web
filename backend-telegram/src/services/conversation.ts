import type { Bindings, ConversationState, ChatMessage, PendingConfirmation, ZansLabModel } from '../types'

export class ConversationManager {
  constructor(private kv: KVNamespace) {}

  /**
   * Load conversation state from KV or initialize fresh
   */
  async load(
    chatId: number,
    telegramUserId: number,
    furbanUserUuid: string,
    furbanRole: string,
    defaultModel: string
  ): Promise<ConversationState> {
    const key = `conv:${chatId}`
    const activeModel = await this.getActiveModel(chatId, defaultModel)

    try {
      const raw = await this.kv.get(key)
      if (raw) {
        const state = JSON.parse(raw) as ConversationState
        // Ensure properties exist and always reflect active model preference
        state.furban_user_uuid = furbanUserUuid
        state.furban_role = furbanRole
        state.active_model = activeModel
        return state
      }
    } catch (e) {
      console.warn('Failed to load conversation from KV:', e)
    }

    return {
      telegram_user_id: telegramUserId,
      furban_user_uuid: furbanUserUuid,
      furban_role: furbanRole,
      messages: [],
      active_model: activeModel,
      last_active: new Date().toISOString(),
    }
  }

  /**
   * Save conversation state to KV with a 24-hour TTL
   */
  async save(chatId: number, state: ConversationState): Promise<void> {
    const key = `conv:${chatId}`
    state.last_active = new Date().toISOString()

    // Keep rolling window of last 20 messages to control token limits
    if (state.messages.length > 20) {
      state.messages = state.messages.slice(-20)
    }

    try {
      await this.kv.put(key, JSON.stringify(state), { expirationTtl: 86400 }) // 24 hours
    } catch (e) {
      console.error('Failed to save conversation state to KV:', e)
    }
  }

  /**
   * Add a message to the conversation history
   */
  addMessage(state: ConversationState, message: ChatMessage): void {
    state.messages.push(message)
    if (state.messages.length > 20) {
      state.messages = state.messages.slice(-20)
    }
  }

  /**
   * Clear conversation history (for /forget command)
   */
  async clear(chatId: number): Promise<void> {
    const key = `conv:${chatId}`
    try {
      await this.kv.delete(key)
    } catch (e) {
      console.warn('Failed to delete conversation state:', e)
    }
  }

  /**
   * Get active model for a chat
   */
  async getActiveModel(chatId: number, defaultModel: string): Promise<string> {
    const key = `model:${chatId}`
    try {
      const stored = await this.kv.get(key)
      if (stored) return stored
    } catch (e) {
      console.warn('Failed to get active model from KV:', e)
    }
    return defaultModel
  }

  /**
   * Set active model for a chat
   */
  async setActiveModel(chatId: number, modelId: string): Promise<void> {
    const key = `model:${chatId}`
    try {
      await this.kv.put(key, modelId)

      // Also update active_model directly in stored conversation state if it exists
      const convKey = `conv:${chatId}`
      const raw = await this.kv.get(convKey)
      if (raw) {
        const state = JSON.parse(raw) as ConversationState
        state.active_model = modelId
        await this.kv.put(convKey, JSON.stringify(state), { expirationTtl: 86400 })
      }
    } catch (e) {
      console.error('Failed to set active model in KV:', e)
    }
  }

  /**
   * Store a pending confirmation for destructive actions (5-min TTL)
   */
  async setPendingConfirmation(chatId: number, confirmation: PendingConfirmation): Promise<void> {
    const key = `conv:${chatId}:pending`
    try {
      await this.kv.put(key, JSON.stringify(confirmation), { expirationTtl: 300 }) // 5 minutes
    } catch (e) {
      console.error('Failed to set pending confirmation in KV:', e)
    }
  }

  /**
   * Retrieve and delete pending confirmation
   */
  async consumePendingConfirmation(chatId: number): Promise<PendingConfirmation | null> {
    const key = `conv:${chatId}:pending`
    try {
      const raw = await this.kv.get(key)
      if (raw) {
        await this.kv.delete(key)
        return JSON.parse(raw) as PendingConfirmation
      }
    } catch (e) {
      console.error('Failed to get pending confirmation from KV:', e)
    }
    return null
  }

  /**
   * Store temporary photo context for the next user message (5-min TTL)
   */
  async setPhotoContext(chatId: number, photo: { file_id: string; file_size?: number }): Promise<void> {
    const key = `conv:${chatId}:photo`
    try {
      await this.kv.put(key, JSON.stringify(photo), { expirationTtl: 300 })
    } catch (e) {
      console.error('Failed to set photo context in KV:', e)
    }
  }

  /**
   * Retrieve and clear temporary photo context
   */
  async consumePhotoContext(chatId: number): Promise<{ file_id: string; file_size?: number } | null> {
    const key = `conv:${chatId}:photo`
    try {
      const raw = await this.kv.get(key)
      if (raw) {
        await this.kv.delete(key)
        return JSON.parse(raw)
      }
    } catch (e) {
      console.error('Failed to get photo context from KV:', e)
    }
    return null
  }

  /**
   * Get cached models list or return null if expired
   */
  async getCachedModels(): Promise<ZansLabModel[] | null> {
    const key = 'models_cache'
    try {
      const raw = await this.kv.get(key)
      if (raw) {
        return JSON.parse(raw) as ZansLabModel[]
      }
    } catch (e) {
      console.warn('Failed to read models cache:', e)
    }
    return null
  }

  /**
   * Cache available models list for 1 hour
   */
  async setCachedModels(models: ZansLabModel[]): Promise<void> {
    const key = 'models_cache'
    try {
      await this.kv.put(key, JSON.stringify(models), { expirationTtl: 3600 })
    } catch (e) {
      console.warn('Failed to write models cache:', e)
    }
  }
}

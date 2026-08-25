export interface Bindings {
  KV: KVNamespace
  TELEGRAM_BOT_TOKEN: string
  ZANSLAB_API_KEY: string
  ZANSLAB_BASE_URL: string
  ZANSLAB_DEFAULT_MODEL: string
  JWT_SECRET: string
  WEBHOOK_SECRET: string
  AUTH_SERVICE_URL: string
  TICKETING_SERVICE_URL: string
}

export interface Variables {
  telegramUser?: TelegramUser
  furbanUser?: FurbanUserMapping
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  is_bot?: boolean
}

export interface FurbanUserMapping {
  uuid: string
  email: string
  role: string
  nickname: string
  telegram_id: string
  telegram_username?: string
}

export interface ConversationState {
  telegram_user_id: number
  furban_user_uuid: string
  furban_role: string
  messages: ChatMessage[]
  last_event_uuid?: string
  active_model?: string
  last_active: string
}

export interface ZansLabModel {
  id: string
  object?: string
  created?: number
  owned_by?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface PendingConfirmation {
  action: string
  tool_name: string
  params: Record<string, any>
  description: string
  expires_at: string
}

export interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: TelegramUser
    chat: {
      id: number
      type: string
    }
    date: number
    text?: string
    caption?: string
    photo?: Array<{
      file_id: string
      file_unique_id: string
      width: number
      height: number
      file_size?: number
    }>
  }
  callback_query?: {
    id: string
    from: TelegramUser
    message?: {
      message_id: number
      chat: { id: number }
    }
    data?: string
  }
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required?: string[]
    }
  }
}

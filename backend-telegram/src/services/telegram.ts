export class TelegramClient {
  private baseUrl: string

  constructor(private botToken: string) {
    this.baseUrl = `https://api.telegram.org/bot${botToken}`
  }

  /**
   * Escape special characters for Telegram MarkdownV2
   */
  static escapeMarkdownV2(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&')
  }

  /**
   * Send a text message with automatic splitting for long texts
   */
  async sendMessage(
    chatId: number,
    text: string,
    options?: {
      parseMode?: 'MarkdownV2' | 'HTML' | 'Markdown'
      replyMarkup?: any
    }
  ): Promise<any> {
    const parseMode = options?.parseMode || 'MarkdownV2'
    const MAX_LENGTH = 4000

    // Split text into chunks if it exceeds Telegram limits
    if (text.length > MAX_LENGTH) {
      const chunks = this.chunkText(text, MAX_LENGTH)
      let lastResult
      for (let i = 0; i < chunks.length; i++) {
        const isLast = i === chunks.length - 1
        lastResult = await this.sendSingleMessage(
          chatId,
          chunks[i],
          parseMode,
          isLast ? options?.replyMarkup : undefined
        )
      }
      return lastResult
    }

    return this.sendSingleMessage(chatId, text, parseMode, options?.replyMarkup)
  }

  private async sendSingleMessage(
    chatId: number,
    text: string,
    parseMode?: string,
    replyMarkup?: any
  ): Promise<any> {
    const payload: Record<string, any> = {
      chat_id: chatId,
      text,
    }

    if (parseMode) {
      payload.parse_mode = parseMode
    }
    if (replyMarkup) {
      payload.reply_markup = replyMarkup
    }

    try {
      const res = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json() as any
      if (!data.ok) {
        // Fallback to plain text if Markdown parsing failed
        if (parseMode && data.description?.includes('can\'t parse entities')) {
          console.warn('MarkdownV2 parsing failed, falling back to plain text')
          delete payload.parse_mode
          const fallbackRes = await fetch(`${this.baseUrl}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          return fallbackRes.json()
        }
        console.error('Telegram sendMessage error:', data)
      }
      return data
    } catch (e) {
      console.error('Telegram fetch error:', e)
      throw e
    }
  }

  /**
   * Send chat action (e.g. 'typing', 'upload_photo')
   */
  async sendChatAction(chatId: number, action: 'typing' | 'upload_photo' = 'typing'): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          action,
        }),
      })
    } catch (e) {
      console.warn('sendChatAction error:', e)
    }
  }

  /**
   * Answer a callback query (from inline keyboard clicks)
   */
  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
        }),
      })
      return res.json()
    } catch (e) {
      console.error('answerCallbackQuery error:', e)
    }
  }

  /**
   * Get file metadata (including download path)
   */
  async getFile(fileId: string): Promise<{ file_id: string; file_path?: string; file_size?: number } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/getFile?file_id=${fileId}`)
      const data = await res.json() as any
      if (data.ok && data.result) {
        return data.result
      }
      return null
    } catch (e) {
      console.error('getFile error:', e)
      return null
    }
  }

  /**
   * Download a file from Telegram servers as ArrayBuffer
   */
  async downloadFile(filePath: string): Promise<ArrayBuffer | null> {
    try {
      const url = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`
      const res = await fetch(url)
      if (res.ok) {
        return res.arrayBuffer()
      }
      return null
    } catch (e) {
      console.error('downloadFile error:', e)
      return null
    }
  }

  private chunkText(text: string, size: number): string[] {
    const chunks: string[] = []
    let current = text
    while (current.length > 0) {
      if (current.length <= size) {
        chunks.push(current)
        break
      }
      // Try to break at a newline
      let splitIndex = current.lastIndexOf('\n', size)
      if (splitIndex === -1 || splitIndex < size / 2) {
        // Fallback to space
        splitIndex = current.lastIndexOf(' ', size)
      }
      if (splitIndex === -1 || splitIndex < size / 2) {
        splitIndex = size
      }
      chunks.push(current.substring(0, splitIndex))
      current = current.substring(splitIndex).trimStart()
    }
    return chunks
  }
}

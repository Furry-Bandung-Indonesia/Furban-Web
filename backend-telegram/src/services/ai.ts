import type { Bindings, ConversationState, ChatMessage, ToolCall, ZansLabModel } from '../types'
import { SYSTEM_PROMPT } from './ai-system-prompt'
import { allTools, executeTool } from '../tools'
import { ApiClient } from './api-client'
import { TelegramClient } from './telegram'
import { ConversationManager } from './conversation'

export class AiEngine {
  private apiClient: ApiClient
  private conversationManager: ConversationManager

  constructor(
    private env: Bindings,
    private telegramClient: TelegramClient
  ) {
    this.apiClient = new ApiClient(env)
    this.conversationManager = new ConversationManager(env.KV)
  }

  /**
   * Fetch available models from ZansLab API with 1-hour KV caching
   */
  async listAvailableModels(): Promise<ZansLabModel[]> {
    const cached = await this.conversationManager.getCachedModels()
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached
    }

    try {
      const url = `${this.env.ZANSLAB_BASE_URL}/models`
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.env.ZANSLAB_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (res.ok) {
        const data = await res.json() as any
        const models: ZansLabModel[] = (data.data || []).map((m: any) => ({
          id: m.id,
          object: m.object,
          created: m.created,
          owned_by: m.owned_by,
        }))

        if (models.length > 0) {
          await this.conversationManager.setCachedModels(models)
          return models
        }
      }
    } catch (e) {
      console.error('Failed to fetch models from ZansLab:', e)
    }

    // Fallback default list if API fails
    return [
      { id: 'an/claude-opus-5' },
      { id: 'an/claude-3-5-sonnet' },
      { id: 'an/gpt-4o' },
      { id: 'an/gpt-4o-mini' },
    ]
  }

  /**
   * Process a user message through the AI tool-calling loop
   */
  async processMessage(
    userMessage: string,
    state: ConversationState,
    photoContext?: { file_id: string; file_size?: number }
  ): Promise<{ response: string; updatedState: ConversationState }> {
    const activeModel = state.active_model || this.env.ZANSLAB_DEFAULT_MODEL || 'an/claude-opus-5'

    // Construct enriched user content if photo is attached
    let enrichedContent = userMessage
    if (photoContext?.file_id) {
      enrichedContent = `[Attached Photo file_id: "${photoContext.file_id}"]\n${userMessage}`
    }

    // Add new user message to conversation history
    this.conversationManager.addMessage(state, {
      role: 'user',
      content: enrichedContent,
    })

    // Construct full messages payload for ZansLab
    const messages: Array<{
      role: string
      content: string | null
      tool_calls?: any[]
      tool_call_id?: string
      name?: string
    }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...state.messages.map(m => ({
        role: m.role,
        content: m.content,
        tool_calls: m.tool_calls,
        tool_call_id: m.tool_call_id,
        name: m.name,
      })),
    ]

    const MAX_TOOL_ITERATIONS = 25
    let currentIteration = 0
    let finalAssistantText = ''

    while (currentIteration < MAX_TOOL_ITERATIONS) {
      currentIteration++

      const requestBody = {
        model: activeModel,
        messages,
        tools: allTools,
        temperature: 0.1,
        max_tokens: 2048,
      }

      let completion: any
      try {
        const res = await fetch(`${this.env.ZANSLAB_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.env.ZANSLAB_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ message: `HTTP ${res.status}` })) as any
          console.error('ZansLab API error response:', errData)
          throw new Error(errData.error?.message || errData.message || `AI gateway error ${res.status}`)
        }

        completion = await res.json()
      } catch (e: any) {
        console.error('ZansLab fetch error:', e)
        finalAssistantText = `⚠️ Error communicating with AI provider (${activeModel}): ${e.message}`
        break
      }

      const choice = completion.choices?.[0]
      if (!choice) {
        finalAssistantText = 'Received empty response from AI model.'
        break
      }

      const responseMessage = choice.message

      // Case 1: AI wants to call tools
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // Record assistant's tool_call request into message history
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: responseMessage.content || null,
          tool_calls: responseMessage.tool_calls,
        }
        messages.push(assistantMsg as any)
        this.conversationManager.addMessage(state, assistantMsg)

        // Execute each tool call sequentially
        for (const tc of responseMessage.tool_calls as ToolCall[]) {
          const toolName = tc.function.name
          let toolArgs: Record<string, any> = {}
          try {
            toolArgs = JSON.parse(tc.function.arguments || '{}')
          } catch (err) {
            console.error(`Failed to parse arguments for tool ${toolName}:`, err)
          }

          let toolResult: any
          try {
            console.log(`Executing tool "${toolName}" with args:`, toolArgs)
            toolResult = await executeTool(toolName, toolArgs, this.apiClient, this.telegramClient)
          } catch (err: any) {
            console.error(`Error executing tool "${toolName}":`, err)
            toolResult = { error: err.message || 'Execution failed' }
          }

          // Remember last event_uuid if found in args or results for context tracking
          if (toolArgs.eventId) {
            state.last_event_uuid = toolArgs.eventId
          } else if (toolResult?.event?.event_uuid) {
            state.last_event_uuid = toolResult.event.event_uuid
          }

          const toolResultMsg: ChatMessage = {
            role: 'tool',
            tool_call_id: tc.id,
            name: toolName,
            content: JSON.stringify(toolResult),
          }

          messages.push(toolResultMsg as any)
          this.conversationManager.addMessage(state, toolResultMsg)
        }

        // Loop continues -> sends tool results back to AI
        continue
      }

      // Case 2: AI returned final text response
      finalAssistantText = responseMessage.content || 'Action completed.'
      const finalMsg: ChatMessage = {
        role: 'assistant',
        content: finalAssistantText,
      }
      this.conversationManager.addMessage(state, finalMsg)
      break
    }

    return {
      response: finalAssistantText,
      updatedState: state,
    }
  }
}

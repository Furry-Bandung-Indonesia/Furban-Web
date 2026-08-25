import type { ToolDefinition } from '../types'
import { ApiClient } from '../services/api-client'

export const moderationTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_moderation',
      description: 'List all BAN and WATCH moderation entries configured for an event.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
        },
        required: ['eventId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_moderation_entry',
      description: 'Add a person to the BAN or WATCH list for an event. BAN blocks purchases; WATCH logs detections for host review. Requires prior confirmation!',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          legal_name: { type: 'string', description: 'Legal name of the individual' },
          nickname: { type: 'string', description: 'Furry/social nickname' },
          email: { type: 'string', description: 'Email address' },
          social_link: { type: 'string', description: 'Social media link' },
          moderation_type: { type: 'string', enum: ['BAN', 'WATCH'], description: 'BAN to block purchases, WATCH to silently monitor' },
          notes: { type: 'string', description: 'Reason / incident documentation' },
        },
        required: ['eventId', 'legal_name', 'moderation_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_moderation_entry',
      description: 'Update an existing moderation entry (name, notes, status, type).',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          modId: { type: 'string', description: 'The UUID of the moderation entry' },
          legal_name: { type: 'string' },
          nickname: { type: 'string' },
          email: { type: 'string' },
          social_link: { type: 'string' },
          moderation_type: { type: 'string', enum: ['BAN', 'WATCH'] },
          status: { type: 'string', enum: ['ACTIVE', 'APPEALED'] },
          notes: { type: 'string' },
        },
        required: ['eventId', 'modId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_moderation_entry',
      description: 'Delete a moderation entry from an event list.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          modId: { type: 'string', description: 'The UUID of the moderation entry to remove' },
        },
        required: ['eventId', 'modId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_moderation_attempts',
      description: 'View the log of blocked purchase attempts and flagged detections for an event.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
        required: ['eventId'],
      },
    },
  },
]

export async function executeModerationTool(
  toolName: string,
  args: Record<string, any>,
  apiClient: ApiClient
): Promise<any> {
  switch (toolName) {
    case 'list_moderation': {
      return apiClient.ticketing('GET', `/api/manage/${args.eventId}/moderation`)
    }

    case 'add_moderation_entry': {
      const { eventId, ...data } = args
      return apiClient.ticketing('POST', `/api/manage/${eventId}/moderation`, data)
    }

    case 'update_moderation_entry': {
      const { eventId, modId, ...data } = args
      return apiClient.ticketing('PUT', `/api/manage/${eventId}/moderation/${modId}`, data)
    }

    case 'delete_moderation_entry': {
      return apiClient.ticketing('DELETE', `/api/manage/${args.eventId}/moderation/${args.modId}`)
    }

    case 'get_moderation_attempts': {
      const { eventId, page, limit } = args
      const params = new URLSearchParams()
      if (page) params.append('page', String(page))
      if (limit) params.append('limit', String(limit))
      const q = params.toString() ? `?${params.toString()}` : ''
      return apiClient.ticketing('GET', `/api/manage/${eventId}/moderation/attempts${q}`)
    }

    default:
      throw new Error(`Unknown moderation tool: ${toolName}`)
  }
}

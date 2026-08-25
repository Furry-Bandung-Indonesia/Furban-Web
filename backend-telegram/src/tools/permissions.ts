import type { ToolDefinition } from '../types'
import { ApiClient } from '../services/api-client'

export const permissionTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_event_permissions',
      description: 'List all assigned hosts and administrators for a specific event.',
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
      name: 'add_event_permission',
      description: 'Grant a user an ADMIN or HOST role for a specific event.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          user_uuid: { type: 'string', description: 'The UUID of the user to assign' },
          role: { type: 'string', enum: ['ADMIN', 'HOST'], description: 'Permission role for this event' },
        },
        required: ['eventId', 'user_uuid', 'role'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_event_permission',
      description: 'Change an assigned event role between ADMIN and HOST.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          permId: { type: 'string', description: 'The UUID of the permission record' },
          role: { type: 'string', enum: ['ADMIN', 'HOST'] },
        },
        required: ['eventId', 'permId', 'role'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_event_permission',
      description: 'Remove a host or admin assignment from an event. Requires prior confirmation!',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          permId: { type: 'string', description: 'The UUID of the permission record' },
        },
        required: ['eventId', 'permId'],
      },
    },
  },
]

export async function executePermissionTool(
  toolName: string,
  args: Record<string, any>,
  apiClient: ApiClient
): Promise<any> {
  switch (toolName) {
    case 'list_event_permissions': {
      return apiClient.ticketing('GET', `/api/manage/${args.eventId}/permissions`)
    }

    case 'add_event_permission': {
      return apiClient.ticketing('POST', `/api/manage/${args.eventId}/permissions`, {
        user_uuid: args.user_uuid,
        role: args.role,
      })
    }

    case 'update_event_permission': {
      return apiClient.ticketing('PUT', `/api/manage/${args.eventId}/permissions/${args.permId}`, {
        role: args.role,
      })
    }

    case 'remove_event_permission': {
      return apiClient.ticketing('DELETE', `/api/manage/${args.eventId}/permissions/${args.permId}`)
    }

    default:
      throw new Error(`Unknown permission tool: ${toolName}`)
  }
}

import type { ToolDefinition } from '../types'
import { ApiClient } from '../services/api-client'

export const tierTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_tiers',
      description: 'List all ticket tiers configured for an event, including prices, quotas, and admin fee.',
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
      name: 'create_tier',
      description: 'Create a new ticket tier for an event.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          tier_name: { type: 'string', description: 'Name of the tier (e.g. VIP, Regular, Early Bird)' },
          tier_description: { type: 'string', description: 'Benefits/description of this tier' },
          price_total: { type: 'integer', description: 'Price in IDR (what the user pays, e.g. 150000)' },
          admin_fee_internal: { type: 'integer', description: 'Internal admin fee cut per ticket in IDR (default 0)' },
          quota_total: { type: 'integer', description: 'Total ticket quota available for this tier (min 1)' },
          sort_order: { type: 'integer', description: 'Display order priority (default 0)' },
          name_your_price: { type: 'boolean', description: 'Allow attendee to pay higher than price_total (default false)' },
        },
        required: ['eventId', 'tier_name', 'price_total', 'quota_total'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_tier',
      description: 'Update a ticket tier. Note: quota_total cannot be decreased below already sold tickets.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          tierId: { type: 'string', description: 'The UUID of the tier' },
          tier_name: { type: 'string' },
          tier_description: { type: 'string' },
          price_total: { type: 'integer' },
          admin_fee_internal: { type: 'integer' },
          quota_total: { type: 'integer' },
          sort_order: { type: 'integer' },
        },
        required: ['eventId', 'tierId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_tier',
      description: 'Delete a ticket tier. Note: Fails if tickets have already been sold for this tier.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          tierId: { type: 'string', description: 'The UUID of the tier to delete' },
        },
        required: ['eventId', 'tierId'],
      },
    },
  },
]

export async function executeTierTool(
  toolName: string,
  args: Record<string, any>,
  apiClient: ApiClient
): Promise<any> {
  switch (toolName) {
    case 'list_tiers': {
      return apiClient.ticketing('GET', `/api/events/${args.eventId}/tiers`)
    }

    case 'create_tier': {
      const { eventId, ...tierData } = args
      if (tierData.name_your_price !== undefined) {
        tierData.name_your_price = tierData.name_your_price ? 1 : 0
      }
      return apiClient.ticketing('POST', `/api/events/${eventId}/tiers`, tierData)
    }

    case 'update_tier': {
      const { eventId, tierId, ...tierData } = args
      return apiClient.ticketing('PUT', `/api/events/${eventId}/tiers/${tierId}`, tierData)
    }

    case 'delete_tier': {
      return apiClient.ticketing('DELETE', `/api/events/${args.eventId}/tiers/${args.tierId}`)
    }

    default:
      throw new Error(`Unknown tier tool: ${toolName}`)
  }
}

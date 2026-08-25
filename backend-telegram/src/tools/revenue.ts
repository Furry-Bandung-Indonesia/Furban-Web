import type { ToolDefinition } from '../types'
import { ApiClient } from '../services/api-client'

export const revenueTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_revenue',
      description: 'Get detailed revenue breakdown for an event (total revenue, admin fee, host disbursement, tickets sold per tier).',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
        },
        required: ['eventId'],
      },
    },
  },
]

export async function executeRevenueTool(
  toolName: string,
  args: Record<string, any>,
  apiClient: ApiClient
): Promise<any> {
  switch (toolName) {
    case 'get_revenue': {
      return apiClient.ticketing('GET', `/api/manage/${args.eventId}/revenue`)
    }
    default:
      throw new Error(`Unknown revenue tool: ${toolName}`)
  }
}

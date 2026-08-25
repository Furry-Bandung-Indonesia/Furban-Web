import type { ToolDefinition } from '../types'
import { ApiClient } from '../services/api-client'

export const attendeeTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_attendees',
      description: 'List attendees for an event with filters for status, tier, check-in state, and search.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          status: { type: 'string', enum: ['under_payment', 'paid', 'expired', 'failed', 'revoked'] },
          tier_uuid: { type: 'string', description: 'Filter by ticket tier UUID' },
          search: { type: 'string', description: 'Search attendee name, nickname, or ticket number' },
          redeemed: { type: 'string', enum: ['0', '1'], description: '1 for redeemed (checked in), 0 for pending check-in' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
        required: ['eventId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_attendee_detail',
      description: 'Get single attendee detail with full ticket information and purchase logs.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          ticketId: { type: 'string', description: 'The UUID of the ticket' },
        },
        required: ['eventId', 'ticketId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_attendee',
      description: 'Update attendee information (food selection, fursuiter status). Legal name and nickname are immutable after payment.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          ticketId: { type: 'string', description: 'The UUID of the ticket' },
          food_selection: { type: 'array', items: { type: 'string' } },
          is_fursuiter: { type: 'boolean' },
        },
        required: ['eventId', 'ticketId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'verify_checkin',
      description: 'Verify a ticket for event check-in via ticket number or attendee search.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          ticket_number: { type: 'string', description: 'Ticket sequence number (e.g. EVT-0001)' },
          search: { type: 'string', description: 'Search term for name/nickname if ticket number not provided' },
        },
        required: ['eventId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'redeem_ticket',
      description: 'Perform check-in for an attendee by marking their paid ticket as redeemed.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          ticket_uuid: { type: 'string', description: 'The UUID of the ticket to redeem' },
        },
        required: ['eventId', 'ticket_uuid'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'unredeem_ticket',
      description: 'Undo/revert a check-in status for an attendee (marks is_redeemed = 0).',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          ticket_uuid: { type: 'string', description: 'The UUID of the ticket' },
        },
        required: ['eventId', 'ticket_uuid'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_checkin_stats',
      description: 'Get live check-in statistics for an event (total, paid, redeemed, and pending counts broken down by tier).',
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

export async function executeAttendeeTool(
  toolName: string,
  args: Record<string, any>,
  apiClient: ApiClient
): Promise<any> {
  switch (toolName) {
    case 'list_attendees': {
      const { eventId, ...queryParams } = args
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(queryParams)) {
        if (v !== undefined && v !== null) params.append(k, String(v))
      }
      const q = params.toString() ? `?${params.toString()}` : ''
      return apiClient.ticketing('GET', `/api/manage/${eventId}/attendees${q}`)
    }

    case 'get_attendee_detail': {
      return apiClient.ticketing('GET', `/api/manage/${args.eventId}/attendees/${args.ticketId}`)
    }

    case 'update_attendee': {
      const { eventId, ticketId, ...data } = args
      return apiClient.ticketing('PUT', `/api/manage/${eventId}/attendees/${ticketId}`, data)
    }

    case 'verify_checkin': {
      const { eventId, ...body } = args
      return apiClient.ticketing('POST', `/api/manage/${eventId}/checkin/verify`, {
        event_uuid: eventId,
        ...body,
      })
    }

    case 'redeem_ticket': {
      return apiClient.ticketing('POST', `/api/manage/${args.eventId}/checkin/redeem`, {
        ticket_uuid: args.ticket_uuid,
      })
    }

    case 'unredeem_ticket': {
      return apiClient.ticketing('POST', `/api/manage/${args.eventId}/checkin/unredeem`, {
        ticket_uuid: args.ticket_uuid,
      })
    }

    case 'get_checkin_stats': {
      return apiClient.ticketing('GET', `/api/manage/${args.eventId}/checkin/stats`)
    }

    default:
      throw new Error(`Unknown attendee tool: ${toolName}`)
  }
}

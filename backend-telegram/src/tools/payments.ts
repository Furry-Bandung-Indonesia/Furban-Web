import type { ToolDefinition } from '../types'
import { ApiClient } from '../services/api-client'

export const paymentTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_payment_channels',
      description: 'List all payment gateway channels (QRIS, VA, E-Wallet) and their active/enabled status.',
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
      name: 'toggle_payment_channel',
      description: 'Enable or disable a specific payment channel for ticket purchases (e.g. QRIS, BCAVA, OVO).',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          code: { type: 'string', description: 'Channel code (e.g. QRIS, BCAVA, MANDIRIVA, BNIIVA)' },
        },
        required: ['eventId', 'code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_event_financials',
      description: 'Get financial summary for an event including total income, payment gateway fees, admin revenue, host payout, and per-channel breakdown.',
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
      name: 'update_financial_settings',
      description: 'Update the admin fee configuration (percentage and/or fixed amount) for an event.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          admin_fee_percent: { type: 'number', description: 'Admin fee percentage (e.g. 5 for 5%)' },
          admin_fee_fixed: { type: 'integer', description: 'Fixed admin fee per ticket in IDR' },
        },
        required: ['eventId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_payment_transactions',
      description: 'List payment transactions for an event with pagination and status filtering.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          status: { type: 'string', enum: ['pending', 'paid', 'expired', 'failed'] },
          channel: { type: 'string', description: 'Channel code filter' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
        required: ['eventId'],
      },
    },
  },
]

export async function executePaymentTool(
  toolName: string,
  args: Record<string, any>,
  apiClient: ApiClient
): Promise<any> {
  switch (toolName) {
    case 'list_payment_channels': {
      return apiClient.ticketing('GET', `/api/manage/${args.eventId}/payment/channels`)
    }

    case 'toggle_payment_channel': {
      return apiClient.ticketing('PUT', `/api/manage/${args.eventId}/payment/channels/${args.code}/toggle`)
    }

    case 'get_event_financials': {
      return apiClient.ticketing('GET', `/api/manage/${args.eventId}/payment/financials`)
    }

    case 'update_financial_settings': {
      const { eventId, ...data } = args
      return apiClient.ticketing('PUT', `/api/manage/${eventId}/payment/financials/settings`, data)
    }

    case 'list_payment_transactions': {
      const { eventId, ...queryParams } = args
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(queryParams)) {
        if (v !== undefined && v !== null) params.append(k, String(v))
      }
      const q = params.toString() ? `?${params.toString()}` : ''
      return apiClient.ticketing('GET', `/api/manage/${eventId}/payment/transactions${q}`)
    }

    default:
      throw new Error(`Unknown payment tool: ${toolName}`)
  }
}

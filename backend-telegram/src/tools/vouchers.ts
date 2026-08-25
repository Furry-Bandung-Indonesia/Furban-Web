import type { ToolDefinition } from '../types'
import { ApiClient } from '../services/api-client'

export const voucherTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_vouchers',
      description: 'List all discount vouchers created for an event.',
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
      name: 'create_voucher',
      description: 'Create a discount voucher code for an event.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          code: { type: 'string', description: 'Unique voucher code string (e.g. EARLYBIRD50)' },
          description: { type: 'string' },
          discount_type: { type: 'string', enum: ['fixed', 'percent'], description: 'fixed (IDR amount) or percent (percentage off)' },
          discount_value: { type: 'number', description: 'Amount in IDR if fixed, or 1-100 if percent' },
          max_uses: { type: 'integer', description: 'Maximum total uses (null for unlimited)' },
          max_uses_per_user: { type: 'integer', description: 'Maximum uses per user account (default 1)' },
          valid_from: { type: 'string', description: 'Start datetime YYYY-MM-DD HH:MM:SS' },
          valid_until: { type: 'string', description: 'Expiry datetime YYYY-MM-DD HH:MM:SS' },
        },
        required: ['eventId', 'code', 'discount_type', 'discount_value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_voucher',
      description: 'Update voucher code details, limits, or active status.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          voucherId: { type: 'string', description: 'The UUID of the voucher' },
          description: { type: 'string' },
          max_uses: { type: 'integer' },
          max_uses_per_user: { type: 'integer' },
          valid_until: { type: 'string' },
          is_active: { type: 'boolean' },
        },
        required: ['eventId', 'voucherId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_voucher',
      description: 'Delete a voucher code. Note: Only vouchers with 0 usages can be deleted. Requires confirmation!',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          voucherId: { type: 'string', description: 'The UUID of the voucher to delete' },
        },
        required: ['eventId', 'voucherId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_voucher_usages',
      description: 'View detailed redemption log of which users redeemed a specific voucher.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          voucherId: { type: 'string', description: 'The UUID of the voucher' },
        },
        required: ['eventId', 'voucherId'],
      },
    },
  },
]

export async function executeVoucherTool(
  toolName: string,
  args: Record<string, any>,
  apiClient: ApiClient
): Promise<any> {
  switch (toolName) {
    case 'list_vouchers': {
      return apiClient.ticketing('GET', `/api/manage/${args.eventId}/vouchers`)
    }

    case 'create_voucher': {
      const { eventId, ...data } = args
      return apiClient.ticketing('POST', `/api/manage/${eventId}/vouchers`, data)
    }

    case 'update_voucher': {
      const { eventId, voucherId, ...data } = args
      if (data.is_active !== undefined) {
        data.is_active = data.is_active ? 1 : 0
      }
      return apiClient.ticketing('PATCH', `/api/manage/${eventId}/vouchers/${voucherId}`, data)
    }

    case 'delete_voucher': {
      return apiClient.ticketing('DELETE', `/api/manage/${args.eventId}/vouchers/${args.voucherId}`)
    }

    case 'get_voucher_usages': {
      return apiClient.ticketing('GET', `/api/manage/${args.eventId}/vouchers/${args.voucherId}/usages`)
    }

    default:
      throw new Error(`Unknown voucher tool: ${toolName}`)
  }
}

import type { ToolDefinition } from '../types'
import { ApiClient } from '../services/api-client'
import { TelegramClient } from '../services/telegram'

export const eventTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_events',
      description: 'List published events with optional pagination and search filter.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'integer', description: 'Page number (default 1)' },
          limit: { type: 'integer', description: 'Items per page (default 20, max 100)' },
          search: { type: 'string', description: 'Search term for name, description, or location' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_event_detail',
      description: 'Get public event details along with available ticket tiers.',
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
      name: 'create_event',
      description: 'Create a new event in the ticketing system. Optionally attach a banner using banner_file_id from Telegram.',
      parameters: {
        type: 'object',
        properties: {
          event_name: { type: 'string', description: 'Name of the event' },
          description: { type: 'string', description: 'Detailed event description' },
          start_time: { type: 'string', description: 'Event start time in YYYY-MM-DD HH:MM:SS format' },
          end_time: { type: 'string', description: 'Event end time in YYYY-MM-DD HH:MM:SS format' },
          location_name: { type: 'string', description: 'Venue or location name' },
          location_lat: { type: 'number', description: 'Latitude coordinate' },
          location_long: { type: 'number', description: 'Longitude coordinate' },
          tos_text: { type: 'string', description: 'Terms of service for attendees' },
          food_enabled: { type: 'boolean', description: 'Enable food options' },
          food_multi_select: { type: 'boolean', description: 'Allow multiple food choices' },
          food_options: { type: 'array', items: { type: 'string' }, description: 'List of food option names' },
          drinks_enabled: { type: 'boolean', description: 'Enable drink options' },
          drinks_multi_select: { type: 'boolean', description: 'Allow multiple drink choices' },
          drink_options: { type: 'array', items: { type: 'string' }, description: 'List of drink option names' },
          status: { type: 'string', enum: ['draft', 'published'], description: 'Initial event status (default draft)' },
          banner_file_id: { type: 'string', description: 'Telegram photo file_id to upload as the event banner' },
        },
        required: ['event_name', 'start_time', 'end_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_event',
      description: 'Update an existing event. Can update details or attach a new banner.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          event_name: { type: 'string' },
          description: { type: 'string' },
          start_time: { type: 'string', description: 'YYYY-MM-DD HH:MM:SS format' },
          end_time: { type: 'string', description: 'YYYY-MM-DD HH:MM:SS format' },
          location_name: { type: 'string' },
          location_lat: { type: 'number' },
          location_long: { type: 'number' },
          tos_text: { type: 'string' },
          food_enabled: { type: 'boolean' },
          food_multi_select: { type: 'boolean' },
          food_options: { type: 'array', items: { type: 'string' } },
          drinks_enabled: { type: 'boolean' },
          drinks_multi_select: { type: 'boolean' },
          drink_options: { type: 'array', items: { type: 'string' } },
          banner_file_id: { type: 'string', description: 'Telegram photo file_id for new banner' },
        },
        required: ['eventId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_event',
      description: 'Permanently delete an event and all its tiers and data. Requires prior confirmation!',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event to delete' },
        },
        required: ['eventId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'change_event_status',
      description: 'Change status of an event (draft -> published -> closed).',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The UUID of the event' },
          status: { type: 'string', enum: ['draft', 'published', 'closed'] },
        },
        required: ['eventId', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_management_dashboard',
      description: 'Get the event management dashboard overview listing managed events and ticket sales counts.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          status: { type: 'string', enum: ['draft', 'published', 'closed'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_event_management_detail',
      description: 'Get full administrative management details of a specific event (all tiers, hosts, configuration).',
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

export async function executeEventTool(
  toolName: string,
  args: Record<string, any>,
  apiClient: ApiClient,
  telegramClient: TelegramClient
): Promise<any> {
  switch (toolName) {
    case 'list_events': {
      const params = new URLSearchParams()
      if (args.page) params.append('page', String(args.page))
      if (args.limit) params.append('limit', String(args.limit))
      if (args.search) params.append('search', args.search)
      const q = params.toString() ? `?${params.toString()}` : ''
      return apiClient.ticketing('GET', `/api/events${q}`)
    }

    case 'get_event_detail': {
      return apiClient.ticketing('GET', `/api/events/${args.eventId}`)
    }

    case 'create_event': {
      const { banner_file_id, ...eventData } = args

      // Normalize array options to JSON strings if passed as arrays
      if (Array.isArray(eventData.food_options)) {
        eventData.food_options = JSON.stringify(eventData.food_options)
      }
      if (Array.isArray(eventData.drink_options)) {
        eventData.drink_options = JSON.stringify(eventData.drink_options)
      }

      // If banner_file_id is provided, download photo and send multipart FormData
      if (banner_file_id) {
        const fileInfo = await telegramClient.getFile(banner_file_id)
        if (fileInfo?.file_path) {
          const fileData = await telegramClient.downloadFile(fileInfo.file_path)
          if (fileData) {
            const formData = new FormData()
            for (const [key, val] of Object.entries(eventData)) {
              if (val !== undefined && val !== null) {
                formData.append(key, typeof val === 'boolean' ? (val ? '1' : '0') : String(val))
              }
            }
            const ext = fileInfo.file_path.split('.').pop() || 'jpg'
            const blob = new Blob([fileData], { type: `image/${ext === 'png' ? 'png' : 'jpeg'}` })
            formData.append('banner', blob, `banner.${ext}`)
            return apiClient.ticketingUpload('POST', '/api/events', formData)
          }
        }
      }

      return apiClient.ticketing('POST', '/api/events', eventData)
    }

    case 'update_event': {
      const { eventId, banner_file_id, ...updateData } = args

      if (Array.isArray(updateData.food_options)) {
        updateData.food_options = JSON.stringify(updateData.food_options)
      }
      if (Array.isArray(updateData.drink_options)) {
        updateData.drink_options = JSON.stringify(updateData.drink_options)
      }

      if (banner_file_id) {
        const fileInfo = await telegramClient.getFile(banner_file_id)
        if (fileInfo?.file_path) {
          const fileData = await telegramClient.downloadFile(fileInfo.file_path)
          if (fileData) {
            const formData = new FormData()
            for (const [key, val] of Object.entries(updateData)) {
              if (val !== undefined && val !== null) {
                formData.append(key, typeof val === 'boolean' ? (val ? '1' : '0') : String(val))
              }
            }
            const ext = fileInfo.file_path.split('.').pop() || 'jpg'
            const blob = new Blob([fileData], { type: `image/${ext === 'png' ? 'png' : 'jpeg'}` })
            formData.append('banner', blob, `banner.${ext}`)
            return apiClient.ticketingUpload('PUT', `/api/events/${eventId}`, formData)
          }
        }
      }

      return apiClient.ticketing('PUT', `/api/events/${eventId}`, updateData)
    }

    case 'delete_event': {
      return apiClient.ticketing('DELETE', `/api/events/${args.eventId}`)
    }

    case 'change_event_status': {
      return apiClient.ticketing('PATCH', `/api/events/${args.eventId}/status`, { status: args.status })
    }

    case 'get_management_dashboard': {
      const params = new URLSearchParams()
      if (args.page) params.append('page', String(args.page))
      if (args.limit) params.append('limit', String(args.limit))
      if (args.status) params.append('status', args.status)
      const q = params.toString() ? `?${params.toString()}` : ''
      return apiClient.ticketing('GET', `/api/manage${q}`)
    }

    case 'get_event_management_detail': {
      return apiClient.ticketing('GET', `/api/manage/${args.eventId}`)
    }

    default:
      throw new Error(`Unknown event tool: ${toolName}`)
  }
}

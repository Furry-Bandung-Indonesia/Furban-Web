import type { ToolDefinition } from '../types'
import { ApiClient } from '../services/api-client'
import { TelegramClient } from '../services/telegram'
import { DEFAULT_EVENT_TOS } from '../config/default-tos'
import { resolveGoogleMapsLocation } from '../services/maps'

export const eventTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_events',
      description: 'List events across all statuses (draft, published, closed) or filtered by status. Shows event name, status, dates, and venue.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['all', 'draft', 'published', 'closed'], description: 'Filter by status. Default is "all" to show all events.' },
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
      description: 'Get full event details along with available ticket tiers and configuration.',
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
      name: 'parse_google_maps_url',
      description: 'Extract exact latitude, longitude, and place/venue name from a Google Maps URL (including short links like maps.app.goo.gl/xxx or goo.gl/maps/xxx).',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Google Maps link or short link' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_event',
      description: 'Create a new event in the ticketing system. Supports attaching banner photo, Google Maps link for auto-coordinates, and default Terms of Service.',
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
          google_maps_url: { type: 'string', description: 'Google Maps link (e.g. maps.app.goo.gl/xxx) to automatically extract lat/long coordinates' },
          tos_text: { type: 'string', description: 'Terms of service for attendees. Set to "default" to use standard Furban Terms & Conditions template.' },
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
      description: 'Update an existing event. Can update details, coordinates from Google Maps, banner, or ToS.',
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
          google_maps_url: { type: 'string', description: 'Google Maps link to extract lat/long coordinates' },
          tos_text: { type: 'string', description: 'Terms of service. Set to "default" to reset to standard Furban ToS template.' },
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
      if (args.status && args.status !== 'all') params.append('status', args.status)
      if (args.search) params.append('search', args.search)
      const q = params.toString() ? `?${params.toString()}` : ''

      // Use management endpoint to return all events (draft, published, closed)
      const result = await apiClient.ticketing('GET', `/api/manage${q}`)
      return result
    }

    case 'get_event_detail': {
      return apiClient.ticketing('GET', `/api/manage/${args.eventId}`)
    }

    case 'parse_google_maps_url': {
      return resolveGoogleMapsLocation(args.url)
    }

    case 'create_event': {
      const { banner_file_id, google_maps_url, ...eventData } = args

      // Auto-populate default ToS if requested or omitted
      if (!eventData.tos_text || eventData.tos_text.toLowerCase() === 'default') {
        eventData.tos_text = DEFAULT_EVENT_TOS
      }

      // Auto-extract coordinates if Google Maps link is provided
      const mapsInput = google_maps_url || (typeof eventData.location_name === 'string' && eventData.location_name.includes('http') ? eventData.location_name : null)
      if (mapsInput && (eventData.location_lat === undefined || eventData.location_long === undefined)) {
        const coords = await resolveGoogleMapsLocation(mapsInput)
        if (coords.success && coords.latitude !== null && coords.longitude !== null) {
          eventData.location_lat = coords.latitude
          eventData.location_long = coords.longitude
          if ((!eventData.location_name || eventData.location_name.includes('http')) && coords.place_name) {
            eventData.location_name = coords.place_name
          }
        }
      }

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
      const { eventId, banner_file_id, google_maps_url, ...updateData } = args

      if (updateData.tos_text && updateData.tos_text.toLowerCase() === 'default') {
        updateData.tos_text = DEFAULT_EVENT_TOS
      }

      const mapsInput = google_maps_url || (typeof updateData.location_name === 'string' && updateData.location_name.includes('http') ? updateData.location_name : null)
      if (mapsInput && (updateData.location_lat === undefined || updateData.location_long === undefined)) {
        const coords = await resolveGoogleMapsLocation(mapsInput)
        if (coords.success && coords.latitude !== null && coords.longitude !== null) {
          updateData.location_lat = coords.latitude
          updateData.location_long = coords.longitude
          if ((!updateData.location_name || updateData.location_name.includes('http')) && coords.place_name) {
            updateData.location_name = coords.place_name
          }
        }
      }

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

import type { ToolDefinition } from '../types'
import { ApiClient } from '../services/api-client'

export const userTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_users',
      description: 'List registered platform users from the auth service. Supports filtering by search term or role.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search term for name, nickname, email, or telegram' },
          role: { type: 'string', enum: ['user', 'admin', 'photographer', 'publisher'], description: 'Filter by role' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_user',
      description: 'Get full profile and account details of a specific user by UUID.',
      parameters: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'User UUID' },
        },
        required: ['uuid'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_user',
      description: 'Create a new user account in backend-auth.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'User email address' },
          password: { type: 'string', description: 'Initial password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)' },
          role: { type: 'string', enum: ['user', 'admin', 'photographer', 'publisher'] },
          legal_name: { type: 'string' },
          nickname: { type: 'string' },
        },
        required: ['email', 'password'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_user',
      description: 'Update user account information (email, name, active status).',
      parameters: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'User UUID' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['user', 'admin', 'photographer', 'publisher'] },
          legal_name: { type: 'string' },
          nickname: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          is_active: { type: 'boolean' },
        },
        required: ['uuid'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_user_role',
      description: 'Change a user\'s platform role (user, admin, photographer, publisher). Requires prior confirmation!',
      parameters: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'User UUID' },
          role: { type: 'string', enum: ['user', 'admin', 'photographer', 'publisher'] },
        },
        required: ['uuid', 'role'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_user',
      description: 'Permanently delete a user account from backend-auth. Requires prior confirmation!',
      parameters: {
        type: 'object',
        properties: {
          uuid: { type: 'string', description: 'User UUID to delete' },
        },
        required: ['uuid'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_users',
      description: 'Search users by nickname, email, legal name, first/last name, Telegram username, or Telegram ID.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keyword' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_auth_stats',
      description: 'Get platform user statistics (total users, active count, pending profiles, breakdown by role).',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
]

export async function executeUserTool(
  toolName: string,
  args: Record<string, any>,
  apiClient: ApiClient
): Promise<any> {
  switch (toolName) {
    case 'list_users': {
      const params = new URLSearchParams()
      if (args.search) params.append('search', args.search)
      if (args.role) params.append('role', args.role)
      const q = params.toString() ? `?${params.toString()}` : ''
      return apiClient.auth('GET', `/auth/admin/users${q}`)
    }

    case 'get_user': {
      return apiClient.auth('GET', `/auth/admin/users/${args.uuid}`)
    }

    case 'create_user': {
      return apiClient.auth('POST', '/auth/admin/users', args)
    }

    case 'update_user': {
      const { uuid, ...data } = args
      return apiClient.auth('PUT', `/auth/admin/users/${uuid}`, data)
    }

    case 'update_user_role': {
      return apiClient.auth('PUT', `/auth/admin/users/${args.uuid}/role`, { role: args.role })
    }

    case 'delete_user': {
      return apiClient.auth('DELETE', `/auth/admin/users/${args.uuid}`)
    }

    case 'search_users': {
      const searchParam = encodeURIComponent(args.query || '')
      return apiClient.auth('GET', `/auth/admin/users?search=${searchParam}`)
    }

    case 'get_auth_stats': {
      return apiClient.auth('GET', '/auth/admin/stats')
    }

    default:
      throw new Error(`Unknown user tool: ${toolName}`)
  }
}

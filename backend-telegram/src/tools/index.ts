import type { ToolDefinition } from '../types'
import { ApiClient } from '../services/api-client'
import { TelegramClient } from '../services/telegram'

import { eventTools, executeEventTool } from './events'
import { tierTools, executeTierTool } from './tiers'
import { attendeeTools, executeAttendeeTool } from './attendees'
import { moderationTools, executeModerationTool } from './moderation'
import { revenueTools, executeRevenueTool } from './revenue'
import { permissionTools, executePermissionTool } from './permissions'
import { voucherTools, executeVoucherTool } from './vouchers'
import { userTools, executeUserTool } from './users'
import { paymentTools, executePaymentTool } from './payments'

/**
 * All 47 tool definitions exposed to ZansLab AI
 */
export const allTools: ToolDefinition[] = [
  ...eventTools,
  ...tierTools,
  ...attendeeTools,
  ...moderationTools,
  ...revenueTools,
  ...permissionTools,
  ...voucherTools,
  ...userTools,
  ...paymentTools,
]

/**
 * Dispatcher to execute any tool by name
 */
export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  apiClient: ApiClient,
  telegramClient: TelegramClient
): Promise<any> {
  if (eventTools.some(t => t.function.name === toolName)) {
    return executeEventTool(toolName, args, apiClient, telegramClient)
  }
  if (tierTools.some(t => t.function.name === toolName)) {
    return executeTierTool(toolName, args, apiClient)
  }
  if (attendeeTools.some(t => t.function.name === toolName)) {
    return executeAttendeeTool(toolName, args, apiClient)
  }
  if (moderationTools.some(t => t.function.name === toolName)) {
    return executeModerationTool(toolName, args, apiClient)
  }
  if (revenueTools.some(t => t.function.name === toolName)) {
    return executeRevenueTool(toolName, args, apiClient)
  }
  if (permissionTools.some(t => t.function.name === toolName)) {
    return executePermissionTool(toolName, args, apiClient)
  }
  if (voucherTools.some(t => t.function.name === toolName)) {
    return executeVoucherTool(toolName, args, apiClient)
  }
  if (userTools.some(t => t.function.name === toolName)) {
    return executeUserTool(toolName, args, apiClient)
  }
  if (paymentTools.some(t => t.function.name === toolName)) {
    return executePaymentTool(toolName, args, apiClient)
  }

  throw new Error(`Tool "${toolName}" is not recognized.`)
}

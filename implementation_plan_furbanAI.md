# Furban Telegram AI Assistant — `backend-telegram` (v2)

A new Cloudflare Worker service that acts as an AI-powered admin assistant via Telegram, enabling natural-language management of events, tickets, check-in, moderation, users, and payments across the Furban platform.

---

## Scope

> [!IMPORTANT]
> **In scope:** `backend-auth` (users, roles, stats) + `backend-ticketing` (events, tiers, tickets, attendees, check-in, moderation, revenue, permissions, vouchers, payments, financials).
> 
> **Out of scope:** `backend` (photos, blogs, approvals, content management). This will NOT be touched.

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                         Telegram Bot Flow                             │
│                                                                       │
│  👤 Admin (Telegram)                                                  │
│    │ "create event Furban Meet on Sept 15 at Jakarta"                 │
│    │ [📷 photo attached → event banner]                               │
│    ▼                                                                  │
│  ┌──────────────────┐                                                 │
│  │ Telegram Bot API  │ ← webhook (POST /webhook/<secret>)            │
│  │ (api.telegram.org)│                                                │
│  └────────┬─────────┘                                                 │
│           ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │              backend-telegram (CF Worker)                     │     │
│  │              Port: 8790 (dev)                                │     │
│  │                                                               │     │
│  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐ │     │
│  │  │   Webhook     │   │  AI Engine    │   │  Tool Executor   │ │     │
│  │  │   Handler     │──▶│  (ZansLab)    │──▶│  (API Calls)     │ │     │
│  │  │              │   │              │   │                  │ │     │
│  │  │ • Verify     │   │ • Strict     │   │ • Execute tools  │ │     │
│  │  │   secret     │   │   system     │   │ • Upload files   │ │     │
│  │  │ • Resolve    │   │   prompt     │   │ • Format result  │ │     │
│  │  │   user       │   │ • 47 tools   │   │ • Return to AI   │ │     │
│  │  │ • Handle     │   │ • Tool loop  │   │                  │ │     │
│  │  │   photos     │   │   (max 5)    │   │                  │ │     │
│  │  │              │   │ • Dynamic    │   │                  │ │     │
│  │  │              │   │   model      │   │                  │ │     │
│  │  │              │   │   switching  │   │                  │ │     │
│  │  └──────────────┘   └──────────────┘   └────────┬─────────┘ │     │
│  │                                                   │           │     │
│  └───────────────────────────────────────────────────┼───────────┘     │
│                                                       │                 │
│                  Internal API Calls (fetch)            │                 │
│      ┌────────────────────────────────────────────────┘                 │
│      ▼                              ▼                                   │
│  ┌──────────────┐         ┌──────────────────┐                         │
│  │  backend-    │         │    backend-       │                         │
│  │   auth       │         │   ticketing       │                         │
│  │   :8788      │         │    :8789          │                         │
│  │              │         │                   │                         │
│  │ • Users      │         │ • Events          │                         │
│  │ • Roles      │         │ • Tiers           │                         │
│  │ • Search     │         │ • Attendees       │                         │
│  │ • Stats      │         │ • Check-in        │                         │
│  │ • Telegram   │         │ • Moderation      │                         │
│  │   linking    │         │ • Revenue         │                         │
│  │              │         │ • Permissions     │                         │
│  │              │         │ • Vouchers        │                         │
│  │              │         │ • Payments        │                         │
│  │              │         │ • Financials      │                         │
│  └──────────────┘         └──────────────────┘                         │
│                                                                         │
│                     ┌───────────────────┐                               │
│                     │  ZansLab AI API   │ ← Tool calling (OpenAI fmt)  │
│                     │ zanslab.id/v1     │                               │
│                     │ an/claude-opus-5  │                               │
│                     └───────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### Component 1: `backend-telegram` (NEW service)

---

#### [NEW] `wrangler.toml`

```toml
name = "backend-telegram"
main = "src/index.ts"
compatibility_date = "2024-12-04"

# ┌───────────────────────────────────────────────┐
# │ Custom domain: add your route here, e.g.:     │
# │ routes = [                                     │
# │   { pattern = "tg.furban.my.id",              │
# │     custom_domain = true }                     │
# │ ]                                              │
# └───────────────────────────────────────────────┘

# KV for conversation state, rate limits
[[kv_namespaces]]
binding = "KV"
id = "PLACEHOLDER"  # Replace after: wrangler kv:namespace create telegram-bot-kv

[vars]
ZANSLAB_BASE_URL = "https://zanslab.id/v1"
ZANSLAB_DEFAULT_MODEL = "an/claude-opus-5"
AUTH_SERVICE_URL = "https://auth.furban.my.id"
TICKETING_SERVICE_URL = "https://ticket.furban.my.id"

# Secrets (set via: wrangler secret put <NAME>):
# TELEGRAM_BOT_TOKEN   — from @BotFather
# ZANSLAB_API_KEY       — from zanslab.id
# JWT_SECRET            — same shared secret as other services
# WEBHOOK_SECRET        — random string to verify Telegram webhook calls
```

---

#### [NEW] `package.json`

```json
{
  "name": "backend-telegram",
  "version": "1.0.0",
  "scripts": {
    "dev": "wrangler dev --port 8790",
    "deploy": "wrangler deploy",
    "setup-webhook": "node scripts/setup_webhook.js"
  },
  "dependencies": {
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "typescript": "^5.0.0",
    "wrangler": "^3.0.0"
  }
}
```

---

#### [NEW] `src/types.ts`

```typescript
export interface Bindings {
  KV: KVNamespace
  TELEGRAM_BOT_TOKEN: string
  ZANSLAB_API_KEY: string
  ZANSLAB_BASE_URL: string
  ZANSLAB_DEFAULT_MODEL: string
  JWT_SECRET: string
  WEBHOOK_SECRET: string
  AUTH_SERVICE_URL: string
  TICKETING_SERVICE_URL: string
}

export interface Variables {
  telegramUser: TelegramUser
  furbanUser: FurbanUserMapping
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
}

export interface FurbanUserMapping {
  furban_uuid: string
  role: string
  nickname: string
  telegram_id: number
}

export interface ConversationState {
  telegram_user_id: number
  furban_user_uuid: string
  furban_role: string
  messages: ChatMessage[]      // Rolling window (last 20)
  last_event_uuid?: string     // Context: last referenced event
  active_model?: string        // Current AI model (overrides default)
  last_active: string
}

export interface ZansLabModel {
  id: string                   // e.g. "an/claude-opus-5"
  name?: string
  owned_by?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string                // tool name (for role=tool)
}

export interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface PendingConfirmation {
  action: string
  tool_name: string
  params: Record<string, any>
  description: string
  expires_at: string
}
```

---

#### [NEW] `src/index.ts` — Main Entry Point

```typescript
// Hono app:
// GET  /                           → health check
// POST /webhook/<WEBHOOK_SECRET>   → Telegram webhook handler
// POST /api/test-message           → dev-only: test AI pipeline with text input
```

The webhook handler:
1. Validates webhook secret from URL path
2. Parses Telegram update (message, callback_query, or photo)
3. Resolves Telegram user → Furban admin (via KV + backend-auth)
4. Rejects non-linked or non-admin users with a message
5. Loads conversation state from KV
6. Handles built-in commands:
   - `/start` — welcome message
   - `/help` — command list
   - `/whoami` — show linked Furban identity
   - `/forget` — clear conversation history
   - `/model` — show current model or switch: `/model an/gpt-4o`
   - `/models` — list all available models from ZansLab
7. Handles callback queries (confirmation buttons: ✅/❌)
8. If photo message: downloads file from Telegram, stores in temp KV, adds to context
9. Sends "typing..." indicator
10. Passes to AI engine → receives response
11. Sends response back via Telegram (supports long messages with chunking)
12. Saves updated conversation state to KV

---

#### [NEW] `src/services/telegram.ts` — Telegram Bot API Client

| Method | Purpose |
|--------|---------|
| `sendMessage(chatId, text, parseMode?, replyMarkup?)` | Send text (MarkdownV2) |
| `sendPhoto(chatId, photoUrl, caption?)` | Send photo with optional caption |
| `sendDocument(chatId, fileUrl, caption?)` | Send file |
| `sendChatAction(chatId, 'typing')` | Show typing indicator |
| `answerCallbackQuery(queryId, text?)` | Answer inline keyboard click |
| `getFile(fileId)` | Get file path for downloading |
| `downloadFile(filePath)` | Download file content as ArrayBuffer |
| `setWebhook(url, secretToken)` | Register webhook |
| `deleteWebhook()` | Remove webhook |
| `escapeMarkdownV2(text)` | Escape special chars for MarkdownV2 |

---

#### [NEW] `src/services/auth.ts` — Service Authentication & User Resolution

```typescript
// Generate service-level JWT (admin role) for calling other backends
async function generateServiceToken(env: Bindings): Promise<string>
// Cached in KV key 'svc_token' with 55-min TTL (tokens expire at 1h)

// Resolve Telegram user → Furban user
// 1. Check KV cache: tg_user:{telegram_id}
// 2. If miss → call GET /auth/admin/users/by-telegram/{telegram_id}
// 3. Cache result in KV
async function resolveTelegramUser(
  telegramUserId: number, env: Bindings
): Promise<FurbanUserMapping | null>
```

---

#### [NEW] `src/services/ai.ts` — AI Engine (ZansLab)

The core orchestration layer:

```typescript
async function processMessage(
  userMessage: string,
  conversationState: ConversationState,
  env: Bindings,
  photoContext?: { fileData: ArrayBuffer; mimeType: string; fileName: string }
): Promise<{ response: string; updatedState: ConversationState }>

// Fetch available models from ZansLab
async function listAvailableModels(env: Bindings): Promise<ZansLabModel[]>
// GET https://zanslab.id/v1/models → returns model list

// Get active model for a chat (from KV or default)
async function getActiveModel(chatId: number, env: Bindings): Promise<string>

// Set active model for a chat
async function setActiveModel(chatId: number, model: string, env: Bindings): Promise<void>
```

**AI Loop:**
```
1. Build messages array:
   - System prompt (strict, see below)
   - Last 20 conversation messages
   - New user message (with photo context if present)
2. Attach all 47 tool definitions
3. Resolve active model: KV key 'model:{chat_id}' or env.ZANSLAB_DEFAULT_MODEL
4. POST zanslab.id/v1/chat/completions
   - model: <active model> (dynamic, per-chat)
   - temperature: 0.1 (very deterministic)
   - max_tokens: 2048
4. IF response contains tool_calls:
   a. For each tool_call, execute the mapped API
   b. Append tool results as role="tool" messages
   c. POST again to AI with updated messages
   d. Repeat up to 5 iterations (prevent infinite loops)
5. IF response contains finish_reason="stop":
   → Return the assistant message text
6. Handle errors gracefully (API failures → tell user what happened)
```

**Timeout:** 25 seconds per tool execution, 55 seconds total per user message.

---

#### [NEW] `src/services/ai-system-prompt.ts` — Strict System Prompt

> [!IMPORTANT]
> This is the most critical file. The system prompt is extremely detailed to prevent hallucination.

```typescript
export const SYSTEM_PROMPT = `
You are the Furban Admin Assistant — an AI-powered Telegram bot that helps administrators 
manage the Furban (Furry Bandung Indonesia) platform. You ONLY interact with backend-auth 
(user management) and backend-ticketing (event management).

═══════════════════════════════════════════════════
IDENTITY & BEHAVIOR RULES
═══════════════════════════════════════════════════

1. LANGUAGE: Always respond in English. No exceptions.

2. ROLE: You are a tool executor, NOT a knowledge base. You do NOT have any information 
   about events, users, tickets, or any data. You MUST call tools to get information.
   NEVER make up data, invent UUIDs, fabricate names, or guess counts/numbers.

3. HONESTY: If a tool returns an error or empty result, report exactly what happened.
   Say "No events found" or "The API returned an error: <message>". 
   NEVER invent or assume data that was not returned by a tool.

4. SCOPE: You can ONLY perform actions that have a corresponding tool. 
   If the user asks for something outside your tools (e.g., "send an email", 
   "post on social media", "edit a blog post"), say:
   "I can only manage users (via auth service) and events/tickets 
   (via ticketing service). That action is outside my capabilities."

5. CONFIRMATION: For ANY destructive action (delete, ban, revoke, change role, 
   close event), you MUST:
   - Clearly state what you are about to do
   - Show the affected entity (name, ID)
   - Ask the user to confirm with "yes" or "confirm"
   - Only execute after explicit user confirmation
   - NEVER auto-confirm destructive actions

6. DATA DISPLAY:
   - Format currency as "Rp X,XXX,XXX" (Indonesian Rupiah)
   - Format dates as "DD MMM YYYY, HH:MM" (e.g., "15 Sep 2026, 10:00")
   - Use bullet points (•) for lists
   - Keep responses concise — max 10 items per list, mention pagination if more exist
   - Use Telegram MarkdownV2 formatting: *bold*, _italic_, \`code\`

7. CONTEXT TRACKING:
   - Remember the last event_uuid discussed in the conversation
   - If the user says "that event", "this event", "the event", resolve to 
     the last referenced event_uuid
   - If ambiguous, ASK which event they mean — do NOT guess

8. TOOL USAGE:
   - Always pass the exact parameter types defined in the tool schema
   - For UUIDs: use the exact UUID returned by previous tool calls, NEVER fabricate
   - For dates: use "YYYY-MM-DD HH:MM:SS" format
   - For prices: use integers (in IDR, no decimals)
   - If a required parameter is missing, ASK the user — do NOT guess

9. ERROR HANDLING:
   - If a tool call fails with 400: tell the user what validation failed
   - If a tool call fails with 404: tell the user the resource was not found
   - If a tool call fails with 403: tell the user they lack permissions
   - If a tool call fails with 500: say "An internal error occurred, please try again"
   - NEVER retry automatically — inform the user and let them decide

10. FILE HANDLING:
    - When the user sends a photo with a message about creating/updating an event, 
      understand that the photo is intended as the event banner
    - Reference the photo in the create_event or update_event tool call using the 
      photo_file_id provided in the context

═══════════════════════════════════════════════════
AVAILABLE SERVICES & DATA MODEL
═══════════════════════════════════════════════════

SERVICE: backend-auth (User Management)
  Tables: users (uuid, email, role, legal_name, nickname, telegram_id, is_active)
  Roles: admin, user, photographer, publisher
  You can: list users, search users, view/update/create/delete users, change roles, view stats

SERVICE: backend-ticketing (Event & Ticket Management)
  Key entities:
  - events: event_uuid, event_name, status (draft→published→closed), 
    start_time, end_time, location, food/drink options, banner
  - ticket_tiers: tier_uuid, tier_name, price_total, admin_fee_internal, 
    quota_total, quota_available
  - tickets: ticket_uuid, ticket_number (EVT-XXXX), purchase_status 
    (under_payment→paid→expired→failed→revoked), is_redeemed
  - moderation_list: BAN or WATCH entries per event
  - event_permissions: ADMIN or HOST roles per event
  - event_vouchers: discount codes per event
  - payment_channels: WijayaPay payment methods
  - payment_transactions: payment records
  - event_financials: admin fee settings, payout tracking

  Event lifecycle: draft → published → closed
  Ticket lifecycle: under_payment → paid (via payment gateway) → redeemed (at event)
  Permission hierarchy: Platform admin > Event creator > Event ADMIN > Event HOST

═══════════════════════════════════════════════════
THINGS YOU MUST NEVER DO
═══════════════════════════════════════════════════

- NEVER fabricate event names, user names, UUIDs, ticket numbers, or statistics
- NEVER assume an event exists without calling list_events or get_event_detail first
- NEVER assume a user exists without calling search_users or list_users first
- NEVER execute a destructive action without user confirmation
- NEVER reveal internal implementation details (JWT secrets, database schemas, API URLs)
- NEVER modify tool parameters to bypass validation (e.g., don't set quota below sold count)
- NEVER respond to questions about topics outside Furban platform management
- NEVER generate SQL queries, code snippets, or technical implementation details
- NEVER claim you performed an action if the tool call returned an error
`
```

---

#### [NEW] `src/services/api-client.ts` — Internal API Client

Unified HTTP client that routes calls to the correct backend:

```typescript
class ApiClient {
  private serviceToken: string

  constructor(private env: Bindings) {}
  
  // Auto-refreshes service JWT from cache
  private async getToken(): Promise<string>

  // Call backend-auth
  async auth(method: string, path: string, body?: any): Promise<ApiResponse>
  // Examples:
  //   auth('GET', '/auth/admin/users')
  //   auth('PUT', '/auth/admin/users/abc-123', { role: 'admin' })

  // Call backend-ticketing
  async ticketing(method: string, path: string, body?: any): Promise<ApiResponse>
  // Examples:
  //   ticketing('GET', '/api/events')
  //   ticketing('POST', '/api/events', { event_name: '...', ... })

  // Call backend-ticketing with multipart/form-data (for banner uploads)
  async ticketingUpload(
    method: string, path: string, 
    formData: FormData
  ): Promise<ApiResponse>
}
```

---

#### [NEW] `src/services/conversation.ts` — Conversation State Manager

```typescript
class ConversationManager {
  // Load conversation state from KV (or create fresh)
  async load(chatId: number, env: Bindings): Promise<ConversationState>
  
  // Save conversation state to KV
  async save(chatId: number, state: ConversationState, env: Bindings): Promise<void>
  
  // Add message to rolling window (trims to last 20)
  addMessage(state: ConversationState, message: ChatMessage): void
  
  // Store pending destructive action for confirmation
  async setPendingConfirmation(
    chatId: number, action: PendingConfirmation, env: Bindings
  ): Promise<void>
  
  // Get and clear pending confirmation
  async consumePendingConfirmation(
    chatId: number, env: Bindings
  ): Promise<PendingConfirmation | null>
  
  // Clear entire conversation (for /forget command)
  async clear(chatId: number, env: Bindings): Promise<void>
}
```

---

#### [NEW] `src/middleware/rate-limiter.ts`

KV-based rate limiting:
- **10 messages per minute** per Telegram user
- **50 AI API calls per hour** per Telegram user

---

#### [NEW] `src/tools/index.ts` — Tool Registry

Exports all tool definitions as a single `tools[]` array in OpenAI function-calling format, plus a `executeTool(name, args, apiClient, env)` dispatcher function.

---

#### [NEW] `src/tools/events.ts` — Event Management (8 tools)

| # | Tool Name | HTTP Call | Description |
|---|-----------|-----------|-------------|
| 1 | `list_events` | `GET /api/events?page=&limit=&search=` | List published events |
| 2 | `get_event_detail` | `GET /api/events/:eventId` | Get event with tiers |
| 3 | `create_event` | `POST /api/events` (JSON or FormData w/ banner) | Create event |
| 4 | `update_event` | `PUT /api/events/:eventId` (JSON or FormData) | Update event |
| 5 | `delete_event` | `DELETE /api/events/:eventId` | Delete event ⚠️ |
| 6 | `change_event_status` | `PATCH /api/events/:eventId/status` | Publish/close ⚠️ |
| 7 | `get_management_dashboard` | `GET /api/manage` | List managed events with stats |
| 8 | `get_event_management_detail` | `GET /api/manage/:eventId` | Full management detail |

**`create_event` tool schema:**
```json
{
  "type": "function",
  "function": {
    "name": "create_event",
    "description": "Create a new event. Returns the created event object.",
    "parameters": {
      "type": "object",
      "properties": {
        "event_name": { "type": "string", "description": "Name of the event" },
        "description": { "type": "string", "description": "Event description" },
        "start_time": { "type": "string", "description": "Start time in YYYY-MM-DD HH:MM:SS format" },
        "end_time": { "type": "string", "description": "End time in YYYY-MM-DD HH:MM:SS format" },
        "location_name": { "type": "string", "description": "Venue name" },
        "location_lat": { "type": "number" },
        "location_long": { "type": "number" },
        "food_enabled": { "type": "boolean" },
        "food_multi_select": { "type": "boolean" },
        "food_options": { "type": "string", "description": "JSON array string of food options" },
        "status": { "type": "string", "enum": ["draft", "published"] },
        "banner_file_id": { "type": "string", "description": "Telegram file_id of a photo to use as event banner" }
      },
      "required": ["event_name", "start_time", "end_time"]
    }
  }
}
```

When `banner_file_id` is present, the tool executor:
1. Downloads the file from Telegram via `getFile()` + `downloadFile()`
2. Constructs a `FormData` with all fields + the banner as a `File` blob
3. Calls `ticketingUpload('POST', '/api/events', formData)`

---

#### [NEW] `src/tools/tiers.ts` — Tier Management (4 tools)

| # | Tool Name | HTTP Call | Description |
|---|-----------|-----------|-------------|
| 1 | `list_tiers` | `GET /api/events/:eventId/tiers` | List tiers |
| 2 | `create_tier` | `POST /api/events/:eventId/tiers` | Create tier |
| 3 | `update_tier` | `PUT /api/events/:eventId/tiers/:tierId` | Update tier |
| 4 | `delete_tier` | `DELETE /api/events/:eventId/tiers/:tierId` | Delete tier ⚠️ |

---

#### [NEW] `src/tools/attendees.ts` — Attendee & Check-in (7 tools)

| # | Tool Name | HTTP Call | Description |
|---|-----------|-----------|-------------|
| 1 | `list_attendees` | `GET /api/manage/:eventId/attendees` | List with filters (status, tier, search, redeemed) |
| 2 | `get_attendee_detail` | `GET /api/manage/:eventId/attendees/:ticketId` | Single attendee |
| 3 | `update_attendee` | `PUT /api/manage/:eventId/attendees/:ticketId` | Update info |
| 4 | `verify_checkin` | `POST /api/manage/:eventId/checkin/verify` | Verify by ticket# or search |
| 5 | `redeem_ticket` | `POST /api/manage/:eventId/checkin/redeem` | Check-in attendee |
| 6 | `unredeem_ticket` | `POST /api/manage/:eventId/checkin/unredeem` | Undo check-in ⚠️ |
| 7 | `get_checkin_stats` | `GET /api/manage/:eventId/checkin/stats` | Check-in statistics |

---

#### [NEW] `src/tools/moderation.ts` — Moderation (5 tools)

| # | Tool Name | HTTP Call | Description |
|---|-----------|-----------|-------------|
| 1 | `list_moderation` | `GET /api/manage/:eventId/moderation` | List BAN/WATCH |
| 2 | `add_moderation_entry` | `POST /api/manage/:eventId/moderation` | Add BAN/WATCH ⚠️ |
| 3 | `update_moderation_entry` | `PUT /api/manage/:eventId/moderation/:modId` | Update entry |
| 4 | `delete_moderation_entry` | `DELETE /api/manage/:eventId/moderation/:modId` | Remove ⚠️ |
| 5 | `get_moderation_attempts` | `GET /api/manage/:eventId/moderation/attempts` | Blocked attempts log |

---

#### [NEW] `src/tools/revenue.ts` — Revenue (1 tool)

| # | Tool Name | HTTP Call | Description |
|---|-----------|-----------|-------------|
| 1 | `get_revenue` | `GET /api/manage/:eventId/revenue` | Revenue breakdown by tier |

---

#### [NEW] `src/tools/permissions.ts` — Host Permissions (4 tools)

| # | Tool Name | HTTP Call | Description |
|---|-----------|-----------|-------------|
| 1 | `list_event_permissions` | `GET /api/manage/:eventId/permissions` | List hosts/admins |
| 2 | `add_event_permission` | `POST /api/manage/:eventId/permissions` | Add host |
| 3 | `update_event_permission` | `PUT /api/manage/:eventId/permissions/:permId` | Change role |
| 4 | `remove_event_permission` | `DELETE /api/manage/:eventId/permissions/:permId` | Remove ⚠️ |

---

#### [NEW] `src/tools/vouchers.ts` — Voucher Management (5 tools)

| # | Tool Name | HTTP Call | Description |
|---|-----------|-----------|-------------|
| 1 | `list_vouchers` | `GET /api/manage/:eventId/vouchers` | List vouchers |
| 2 | `create_voucher` | `POST /api/manage/:eventId/vouchers` | Create voucher |
| 3 | `update_voucher` | `PATCH /api/manage/:eventId/vouchers/:voucherId` | Edit voucher |
| 4 | `delete_voucher` | `DELETE /api/manage/:eventId/vouchers/:voucherId` | Delete ⚠️ |
| 5 | `get_voucher_usages` | `GET /api/manage/:eventId/vouchers/:voucherId/usages` | Usage log |

---

#### [NEW] `src/tools/users.ts` — User Management (8 tools)

| # | Tool Name | HTTP Call (backend-auth) | Description |
|---|-----------|--------------------------|-------------|
| 1 | `list_users` | `GET /auth/admin/users` | List all users |
| 2 | `get_user` | `GET /auth/admin/users/:uuid` | User detail |
| 3 | `create_user` | `POST /auth/admin/users` | Create user |
| 4 | `update_user` | `PUT /auth/admin/users/:uuid` | Update user |
| 5 | `update_user_role` | `PUT /auth/admin/users/:uuid/role` | Change role ⚠️ |
| 6 | `delete_user` | `DELETE /auth/admin/users/:uuid` | Delete user ⚠️ |
| 7 | `search_users` | `GET /auth/users/search?q=` | Search by name/email |
| 8 | `get_auth_stats` | `GET /auth/admin/stats` | Platform user stats |

---

#### [NEW] `src/tools/payments.ts` — Payment & Financials (5 tools)

| # | Tool Name | HTTP Call (backend-ticketing) | Description |
|---|-----------|-------------------------------|-------------|
| 1 | `list_payment_channels` | `GET /api/manage/:eventId/payment/channels` | List channels |
| 2 | `toggle_payment_channel` | `PUT /api/manage/:eventId/payment/channels/:code/toggle` | Enable/disable |
| 3 | `get_event_financials` | `GET /api/manage/:eventId/payment/financials` | Financial summary |
| 4 | `update_financial_settings` | `PUT /api/manage/:eventId/payment/financials/settings` | Update admin fee |
| 5 | `list_payment_transactions` | `GET /api/manage/:eventId/payment/transactions` | Transaction list |

---

**Total: 47 tool definitions** covering the entire auth + ticketing API surface.

---

#### [NEW] `scripts/setup_webhook.js`

One-time script to register the Telegram webhook:

```bash
# Usage:
TELEGRAM_BOT_TOKEN=xxx \
WEBHOOK_URL=https://YOUR-DOMAIN/webhook/YOUR-WEBHOOK-SECRET \
node scripts/setup_webhook.js
```

---

#### [NEW] Complete File Tree

```
backend-telegram/
├── package.json
├── tsconfig.json
├── wrangler.toml
├── scripts/
│   └── setup_webhook.js            # Register Telegram webhook
└── src/
    ├── index.ts                     # Hono app — webhook route, health check
    ├── types.ts                     # All TypeScript interfaces
    ├── middleware/
    │   └── rate-limiter.ts          # KV-based rate limiting
    ├── services/
    │   ├── telegram.ts              # Telegram Bot API client
    │   ├── auth.ts                  # Service JWT + Telegram→Furban user mapping
    │   ├── ai.ts                    # ZansLab AI engine (tool calling loop)
    │   ├── ai-system-prompt.ts      # Strict system prompt (full text)
    │   ├── api-client.ts            # Internal HTTP client for auth + ticketing
    │   └── conversation.ts          # KV conversation state manager
    └── tools/
        ├── index.ts                 # Tool registry + dispatcher
        ├── events.ts                # 8 tools — Event CRUD + management
        ├── tiers.ts                 # 4 tools — Tier CRUD
        ├── attendees.ts             # 7 tools — Attendees + check-in
        ├── moderation.ts            # 5 tools — Moderation
        ├── revenue.ts               # 1 tool  — Revenue dashboard
        ├── permissions.ts           # 4 tools — Host permissions
        ├── vouchers.ts              # 5 tools — Voucher management
        ├── users.ts                 # 8 tools — User management (auth)
        └── payments.ts              # 5 tools — Payment channels + financials
```

---

### Component 2: `backend-auth` Changes (Telegram linking)

---

#### [MODIFY] [`schema.sql`](file:///d:/SERVER/Furban-Web/backend-auth/schema.sql)

Add `telegram_id` column to the `users` table:

```diff
 CREATE TABLE users (
   uuid TEXT PRIMARY KEY,
   email TEXT UNIQUE NOT NULL,
   password_hash TEXT NOT NULL,
   role TEXT NOT NULL DEFAULT 'user',
   legal_name TEXT,
   nickname TEXT,
   first_name TEXT,
   last_name TEXT,
   date_of_birth TEXT,
   social_link TEXT,
   profile_image_url TEXT,
   is_active INTEGER DEFAULT 1,
   pending_profile INTEGER DEFAULT 1,
   auth_provider TEXT NOT NULL DEFAULT 'local',
   google_id TEXT,
+  telegram_id TEXT,
+  telegram_username TEXT,
+  telegram_linked_at DATETIME,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
 );
```

**Migration SQL** (run on existing DB):
```sql
ALTER TABLE users ADD COLUMN telegram_id TEXT;
ALTER TABLE users ADD COLUMN telegram_username TEXT;
ALTER TABLE users ADD COLUMN telegram_linked_at DATETIME;
CREATE UNIQUE INDEX idx_users_telegram_id ON users(telegram_id);
```

---

#### [MODIFY] [`src/routes/auth.ts`](file:///d:/SERVER/Furban-Web/backend-auth/src/routes/auth.ts)

Add 3 new endpoints for Telegram integration:

```typescript
/**
 * POST /auth/me/telegram/link
 * Link current user's account to a Telegram ID.
 * Called from frontend after user enters their Telegram chat ID or
 * uses a deep-link from the bot.
 * 
 * Body: { telegram_id: string, telegram_username?: string }
 * Auth: Required (any authenticated user with admin role)
 */

/**
 * DELETE /auth/me/telegram/unlink
 * Unlink Telegram from current user's account.
 * Auth: Required
 */

/**
 * GET /auth/admin/users/by-telegram/:telegramId
 * Lookup a user by their Telegram ID.
 * Used by backend-telegram to resolve Telegram user → Furban user.
 * Auth: Required (admin or service token)
 * Response: { uuid, email, role, nickname, telegram_id }
 */
```

---

#### [MODIFY] [`src/routes/admin.ts`](file:///d:/SERVER/Furban-Web/backend-auth/src/routes/admin.ts)

Add endpoint to list Telegram-linked users:

```typescript
/**
 * GET /auth/admin/telegram-users
 * List all users who have linked their Telegram account.
 * Auth: Required (admin)
 * Response: [{ uuid, email, nickname, role, telegram_id, telegram_username, telegram_linked_at }]
 */
```

Also update `GET /auth/admin/users` response to include `telegram_id`, `telegram_username`, `telegram_linked_at` fields.

---

#### [MODIFY] [`src/routes/profile.ts`](file:///d:/SERVER/Furban-Web/backend-auth/src/routes/profile.ts)

Update `GET /auth/me` to include `telegram_id` and `telegram_username` in the response.

---

### Component 3: Frontend Changes (Telegram Integration Page)

---

#### [NEW] `frontend/src/views/dashboard/TelegramIntegration.vue`

Admin-only dashboard page with two sections:

**Section 1: My Telegram Connection**
- Shows current user's Telegram connection status
- "Connect Telegram" button → opens a modal with instructions:
  1. Open the Furban bot in Telegram: `t.me/FurbanBot`
  2. Send `/start` to get your Telegram ID
  3. Enter your Telegram ID in the input field
  4. Click "Link Account"
- "Disconnect" button to unlink
- Shows linked Telegram username and date

**Section 2: Connected Users** (table)
- Lists all users with linked Telegram accounts
- Columns: User (avatar + nickname), Email, Role, Telegram ID, Username, Linked At
- Search/filter bar
- "Unlink" action button per row (admin can unlink other users)

---

#### [MODIFY] [`frontend/src/views/DashboardLayout.vue`](file:///d:/SERVER/Furban-Web/frontend/src/views/DashboardLayout.vue)

Add "Telegram Bot" nav item for admin users:

```diff
   if (role === 'admin') {
     items.push({ path: '/dashboard/users', label: 'Manage Users', icon: IconUsers })
     items.push({ path: '/event/manage', label: 'Event Management', icon: IconEvents })
+    items.push({ path: '/dashboard/telegram', label: 'Telegram Bot', icon: IconTelegram })
   }
```

With a Telegram icon (paper plane SVG).

---

#### [MODIFY] [`frontend/src/router/index.js`](file:///d:/SERVER/Furban-Web/frontend/src/router/index.js)

Add route inside dashboard children:

```diff
         {
           path: 'users',
           name: 'dashboard-users',
           component: lazyLoad(() => import('../views/dashboard/ManageUsers.vue')),
           meta: { allowedRoles: ['admin'] }
         },
+        {
+          path: 'telegram',
+          name: 'dashboard-telegram',
+          component: lazyLoad(() => import('../views/dashboard/TelegramIntegration.vue')),
+          meta: { allowedRoles: ['admin'] }
+        },
```

---

#### [MODIFY] `frontend/src/services/authApi.js`

Add Telegram API methods:

```javascript
// Link Telegram account
async linkTelegram(telegramId, telegramUsername) { ... }

// Unlink Telegram account
async unlinkTelegram() { ... }

// Admin: list all Telegram-linked users
async getTelegramUsers() { ... }

// Admin: unlink another user's Telegram
async adminUnlinkTelegram(userUuid) { ... }
```

---

## Security Model

```
┌──────────────────────────────────────────────────────┐
│                  Security Layers                      │
│                                                       │
│  Layer 1: Webhook Secret                              │
│  ─────────────────────                                │
│  POST /webhook/<WEBHOOK_SECRET>                       │
│  URL path contains the secret. Requests to other      │
│  paths are rejected. Telegram includes the secret     │
│  in the X-Telegram-Bot-Api-Secret-Token header too.  │
│                                                       │
│  Layer 2: Telegram → Furban User Resolution            │
│  ──────────────────────────────────────────            │
│  Only Telegram users with a linked Furban account      │
│  AND admin role can use the bot. Others receive:       │
│  "You are not authorized. Link your account in the     │
│  Furban admin dashboard first."                        │
│                                                       │
│  Layer 3: Service JWT Token                            │
│  ──────────────────────────                            │
│  Generated with the shared JWT_SECRET.                 │
│  Contains: sub=<furban_uuid>, role=admin, exp=1h       │
│  Same format as backend-auth tokens — all backends     │
│  accept it transparently.                              │
│                                                       │
│  Layer 4: AI Confirmation for Destructive Actions      │
│  ────────────────────────────────────────────           │
│  System prompt enforces confirmation for ⚠️ actions.   │
│  Pending action stored in KV (5-min TTL).              │
│  Inline keyboard: [✅ Confirm] [❌ Cancel]              │
│                                                       │
│  Layer 5: Rate Limiting                                │
│  ──────────────────────                                │
│  10 msgs/min, 50 AI calls/hour per user.               │
│  Prevents abuse and controls ZansLab API costs.        │
│                                                       │
│  Layer 6: Tool Scope Enforcement                       │
│  ─────────────────────────────                         │
│  AI can ONLY call defined tools. No arbitrary          │
│  API calls. System prompt explicitly forbids           │
│  actions outside tool definitions.                     │
└──────────────────────────────────────────────────────┘
```

---

## KV Storage Patterns

| Key Pattern | Value | TTL | Purpose |
|---|---|---|---|
| `tg_user:{telegram_id}` | `{ furban_uuid, role, nickname }` | 1 hour | User resolution cache |
| `conv:{chat_id}` | `ConversationState` JSON | 24h | Conversation history (rolling 20 msgs) |
| `conv:{chat_id}:pending` | `PendingConfirmation` JSON | 5 min | Destructive action confirmation |
| `conv:{chat_id}:photo` | `{ file_id, mime_type, file_name }` | 5 min | Temp photo context for next message |
| `model:{chat_id}` | model ID string (e.g. `an/gpt-4o`) | Persistent | Per-chat AI model override |
| `models_cache` | `ZansLabModel[]` JSON | 1 hour | Cached model list from ZansLab |
| `rate:msg:{telegram_id}` | counter | 60s | Message rate limit |
| `rate:ai:{telegram_id}` | counter | 3600s | AI call rate limit |
| `svc_token` | JWT string | 3300s (55m) | Cached service token |

---

## Photo/File Upload Flow

```
User sends photo to Telegram bot
    │
    ▼
Webhook receives update with photo array
    │
    ▼
Extract largest photo size → file_id
    │
    ▼
If message has caption → treat as command + banner context
If message has no caption → store file_id in KV (conv:{chat_id}:photo)
                            and reply "Photo received. What would you like to do with it?"
    │
    ▼
When create_event or update_event tool is called with banner_file_id:
    │
    ▼
1. Call Telegram getFile(file_id) → file_path
2. Call Telegram downloadFile(file_path) → ArrayBuffer
3. Create FormData with event fields + File blob
4. POST to ticketing service as multipart/form-data
    │
    ▼
Ticketing service handles upload to R2 (existing logic)
```

---

## Interaction Examples

### Creating an Event with Banner
```
👤 Admin: [📷 sends photo]
          create event Furban Gathering on October 20, 2026, 
          10:00 AM to 5:00 PM at Braga CityWalk Bandung

🤖 Bot:   ✅ *Event created successfully!*
          
          📋 *Furban Gathering*
          📅 20 Oct 2026, 10:00 — 17:00
          📍 Braga CityWalk Bandung
          🖼 Banner uploaded
          📊 Status: Draft
          
          Would you like to add ticket tiers or publish it?
```

### Checking Revenue
```
👤 Admin: what's the revenue for Furban Meet?

🤖 Bot:   💰 *Revenue — Furban Meet August 2026*
          
          • Regular: 85/100 sold — Rp 8,500,000
          • VIP: 42/50 sold — Rp 21,000,000
          
          *Total:* Rp 29,500,000 (127 tickets)
          *Check-in:* 89/127 (70%)
          *Admin fee:* Rp 2,950,000
          *Host payout:* Rp 26,550,000
```

### Destructive Action Confirmation
```
👤 Admin: delete the last event

🤖 Bot:   ⚠️ *Confirm Deletion*
          
          You are about to delete:
          📋 *Furban Gathering* (draft)
          📅 20 Oct 2026
          
          This will permanently delete the event and all related 
          data (tiers, tickets, permissions).
          
          [✅ Confirm Delete] [❌ Cancel]

👤 Admin: [clicks ✅ Confirm Delete]

🤖 Bot:   🗑 Event "Furban Gathering" has been deleted.
```

### Unauthorized Access
```
👤 Random user: /start

🤖 Bot:   🔒 *Access Denied*
          
          This bot is for Furban platform administrators only.
          
          If you are an admin, link your Telegram account at:
          https://furban.my.id/dashboard/telegram
```

---

## Deployment Steps

```bash
# 1. Initialize project
cd backend-telegram
npm install

# 2. Create KV namespace
wrangler kv:namespace create telegram-bot-kv
# → Copy the ID into wrangler.toml

# 3. Set secrets
wrangler secret put TELEGRAM_BOT_TOKEN      # From @BotFather
wrangler secret put ZANSLAB_API_KEY          # From zanslab.id
wrangler secret put JWT_SECRET               # Same as other services
wrangler secret put WEBHOOK_SECRET           # Generate: openssl rand -hex 32

# 4. (Optional) Add custom domain in wrangler.toml routes[]

# 5. Deploy
wrangler deploy

# 6. Register webhook with Telegram
npm run setup-webhook

# 7. Run backend-auth migration
wrangler d1 execute furban-auth-db --command "ALTER TABLE users ADD COLUMN telegram_id TEXT;"
wrangler d1 execute furban-auth-db --command "ALTER TABLE users ADD COLUMN telegram_username TEXT;"
wrangler d1 execute furban-auth-db --command "ALTER TABLE users ADD COLUMN telegram_linked_at DATETIME;"
wrangler d1 execute furban-auth-db --command "CREATE UNIQUE INDEX idx_users_telegram_id ON users(telegram_id);"

# 8. Deploy updated backend-auth
cd ../backend-auth && wrangler deploy

# 9. Deploy updated frontend
cd ../frontend && npm run build && wrangler pages deploy dist

# 10. Link your Telegram account via the dashboard
#     → Go to furban.my.id/dashboard/telegram
#     → Open the bot, send /start to get your Telegram ID
#     → Enter it in the dashboard
```

---

## Verification Plan

### Automated Tests
```bash
# Test webhook handler with mock payloads
node scripts/test_webhook.js

# Test each tool against real APIs (dev)
node scripts/test_tools.js
```

### Manual Verification
1. `/start` → verify welcome message (if linked) or access denied (if not linked)
2. `/help` → verify command list
3. "list events" → verify events from ticketing API
4. "create event Test on tomorrow 10am-5pm" → verify event created
5. Send a photo + "create event Banner Test on Dec 1" → verify banner uploaded
6. "revenue for [event]" → verify revenue numbers match dashboard
7. "delete event [name]" → verify confirmation flow (inline keyboard)
8. "check in EVT-0001" → verify verify+redeem flow
9. Send from un-linked Telegram → verify access denied
10. Send 15 rapid messages → verify rate limit kicks in
11. Frontend: Dashboard → Telegram Bot → Link account → verify linked
12. Frontend: Dashboard → Telegram Bot → View connected users list

# Relay — AI Customer Support Chat

Live demo: **[relay-web-ashy.vercel.app](https://relay-web-ashy.vercel.app)**

An AI-powered customer support chat where users can ask questions and receive streamed responses from an LLM in real time. Conversations are persisted and restored across page reloads. A sidebar lets users navigate between past conversations.

## Running Locally

### Prerequisites

- Node.js ≥ 20
- pnpm (`npm install -g pnpm`)
- PostgreSQL (local or hosted — [Neon](https://neon.tech) works well)
- An API key from [OpenRouter](https://openrouter.ai) or [OpenAI](https://platform.openai.com)

### 1. Install dependencies

```bash
git clone https://github.com/cb7chaitanya/relay.git
cd relay
pnpm install
```

### 2. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/relay_dev
LLM_PROVIDER=openrouter          # or "openai"
OPENROUTER_API_KEY=sk-or-v1-...  # required if provider=openrouter
OPENAI_API_KEY=sk-...            # required if provider=openai
CORS_ORIGIN=http://localhost:3000
```

For the frontend (optional — defaults to `http://localhost:3001`):

```bash
cp apps/web/.env.example apps/web/.env.local
```

### 3. Set up the database

```bash
cd apps/api
pnpm exec prisma migrate dev
pnpm exec tsx prisma/seed.ts   # optional: seeds a sample conversation
```

### 4. Run

```bash
# From project root — two terminals:
pnpm dev:api    # Express API on :3001
pnpm dev:web    # Next.js on :3000
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture Overview

```
relay/
├── apps/
│   ├── api/     → Express + TypeScript backend     (Railway)
│   └── web/     → Next.js 15 + React 19 frontend   (Vercel)
└── packages/
    └── shared/  → Zod schemas + TypeScript types    (internal)
```

### Backend Structure

The backend follows a clean layered architecture:

```
Routes → Services → Repositories → Prisma / PostgreSQL
                  → Providers    → LLM (OpenAI / OpenRouter)
```

| Layer | Responsibility |
|---|---|
| **Routes** (`src/routes/`) | HTTP handling, SSE streaming, request validation (Zod) |
| **Services** (`src/services/`) | Business logic and orchestration. Completely provider-agnostic — never imports any LLM SDK |
| **Repositories** (`src/repositories/`) | Data access through Prisma. Pure functions, no business logic |
| **Providers** (`src/providers/`) | LLM abstraction behind an `LLMProvider` interface. Two implementations: `OpenAIProvider` and `OpenRouterProvider`. A factory selects the active provider at startup based on the `LLM_PROVIDER` env var |
| **Middleware** (`src/middleware/`) | Request IDs, rate limiting (20 req/min/IP), Zod validation, error handling |

### Frontend Structure

| Layer | Responsibility |
|---|---|
| **`useChat` hook** | Single source of truth for all chat state — messages, streaming, sessions, errors |
| **Components** | Presentational: `ChatWindow`, `Sidebar`, `MessageList`, `MessageBubble`, `ChatInput`, `EmptyState` |
| **`lib/api.ts`** | Fetch wrapper with a custom SSE stream parser (needed because `EventSource` only supports GET) |

### Data Model

```
Conversation
  ├── id         (UUID, server-generated)
  ├── title      (first user message, truncated to 40 chars)
  ├── createdAt
  └── updatedAt  (auto-updated on new messages)

Message
  ├── id         (UUID)
  ├── conversationId → Conversation
  ├── sender     (enum: USER | ASSISTANT)
  ├── text
  ├── promptTokens      (nullable, for cost tracking)
  ├── completionTokens  (nullable, for cost tracking)
  └── createdAt
```

### API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/chat/message` | Send a message, receive SSE-streamed AI response |
| `GET` | `/chat/sessions` | List all conversations (title, updatedAt, messageCount) |
| `GET` | `/chat/session/:id` | Fetch messages for a conversation |
| `DELETE` | `/chat/session/:id` | Delete a conversation |
| `GET` | `/health` | Health check (database status + active provider) |

`POST /chat/message` accepts `{ message: string, sessionId?: string }` and returns a Server-Sent Events stream:

```
event: session  →  { "sessionId": "uuid" }
event: token    →  { "token": "Hello" }
event: token    →  { "token": " there!" }
event: done     →  { "promptTokens": 180, "completionTokens": 42 }
```

## LLM Integration

**Provider:** [OpenRouter](https://openrouter.ai) (default) or OpenAI — configurable via `LLM_PROVIDER` env var.

**Default model:** `google/gemini-2.5-flash` (via OpenRouter). Fast, inexpensive, and capable enough for support conversations.

**Prompting approach:**

The system prompt defines the AI as a helpful e-commerce support agent with hardcoded domain knowledge:

- **Shipping:** Worldwide, 3–5 business days
- **Returns:** 30-day refund policy, items must be in original condition
- **Support hours:** Monday–Friday, 9 AM – 6 PM IST

The last 10 messages of the conversation are included as context for each request. This keeps token usage bounded while maintaining conversational coherence.

**Guardrails:**

- 30-second timeout on LLM requests (aborted via `AbortSignal`)
- Graceful error messages surfaced to the user (never raw API errors)
- Rate limiting: 20 requests per minute per IP
- Input validation: empty messages rejected, max 4000 characters
- Partial responses are not persisted — only fully completed assistant messages are saved

## Design Decisions

| Decision | Why |
|---|---|
| **SSE streaming** instead of WebSocket | The data flow is one-directional (server→client). SSE is simpler, works over HTTP/1.1, needs no connection upgrade, and is easier to deploy |
| **Provider abstraction** | An `LLMProvider` interface decouples the service layer from any specific SDK. Swapping from OpenRouter to OpenAI (or any OpenAI-compatible API) is a single env var change |
| **Optimistic user messages** | The user's message appears instantly in the UI before the backend responds. This makes the app feel fast even when the LLM takes a few seconds |
| **`sessionId` in localStorage** | Simplest anonymous session persistence — no auth needed for a support chat widget |
| **Server-generated UUIDs** | All IDs come from the database, never the client. Prevents collisions and ID spoofing |
| **No shared runtime code** | `packages/shared` contains only types and Zod schemas. No runtime logic is shared between frontend and backend — keeps deploy units independent |
| **Conversation titles from first message** | Zero-cost, zero-latency alternative to LLM-generated titles. For support chats, the first question is almost always the best title |

## Trade-offs & If I Had More Time

**Current trade-offs:**

- **No authentication** — anyone with a sessionId can read that conversation. Fine for anonymous support; would need auth for sensitive data
- **No message pagination** — all messages load at once on session restore. Fine for support conversations (typically <50 messages); would need cursor-based pagination for longer threads
- **In-memory rate limiting** — resets on server restart. Sufficient for single-instance; Redis needed for multi-instance

**If I had more time, I would add:**

- **WebSocket upgrade** for bidirectional real-time communication (agent typing indicators, read receipts)
- **Markdown rendering** in assistant messages for formatted responses (lists, bold, code blocks)
- **Redis caching** for session data and rate limiting across instances
- **E2E tests** with Playwright covering the full chat flow
- **Message search** across conversations
- **Conversation export** (download as PDF/text)
- **Proper observability** — structured logging to a service like Datadog/Axiom, error tracking via Sentry
- **Multi-tenant support** — associate conversations with a store/brand, each with their own system prompt and knowledge base

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | API server port |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `LLM_PROVIDER` | No | `openrouter` | `openai` or `openrouter` |
| `OPENAI_API_KEY` | If provider=openai | — | OpenAI API key |
| `OPENROUTER_API_KEY` | If provider=openrouter | — | OpenRouter API key |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3001` | API base URL for the frontend |

## Deployment

The app is deployed as:

- **Frontend:** [Vercel](https://vercel.com) — `apps/web`
- **Backend:** [Railway](https://railway.app) — `apps/api`
- **Database:** [Neon](https://neon.tech) — serverless PostgreSQL

# BillPaint Backend Integration - Implementation Overview

## Project Context

**Tech Stack:**
- Frontend: Vite + React + TypeScript
- Routing: React Router
- State: Zustand with localStorage persistence
- UI: Tailwind CSS + shadcn/ui
- Deployment Target: Vercel

## Integration Services

### 1. Clerk (Authentication)
- **Purpose:** User authentication and session management
- **Free Tier:** 10,000 Monthly Active Users
- **Why:** Pre-built React components, social logins, secure session handling

### 2. Supabase (Database)
- **Purpose:** PostgreSQL database with real-time capabilities
- **Free Tier:** 500MB database, 2GB bandwidth, 50,000 MAUs
- **Why:** Row-level security, REST API, works perfectly with client-side apps

### 3. Lemon Squeezy (Payments)
- **Purpose:** Monthly subscription billing for OCR scanning features
- **Cost:** Merchant of Record service - handles tax, compliance, and payments (5% + 50¢)
- **Why:** Stripe-based MoR with built-in tax handling, simpler compliance, overlay checkout

## Implementation Phases

### Phase 1: Environment Setup & Dependencies (30 min)
- Install required packages
- Configure environment variables
- Set up service accounts

### Phase 2: Clerk Authentication (2-3 hours)
- Integrate Clerk React SDK
- Protect routes with authentication
- Add user profile UI
- Handle sign-in/sign-up flows

### Phase 3: Supabase Database (3-4 hours)
- Set up database schema with RLS policies
- Configure Clerk as Supabase auth provider
- Create authenticated Supabase client
- Migrate Zustand stores to use Supabase

### Phase 4: Vercel Serverless Functions (2-3 hours)
- Set up API routes for server-side operations
- Create Supabase service client for admin operations
- Implement CRUD endpoints

### Phase 5: Lemon Squeezy Integration (3-4 hours)
- Configure Lemon Squeezy products and variants
- Create checkout overlay integration
- Implement webhook handler with signature verification
- Build subscription UI components
- Add OCR usage tracking and limits

### Phase 6: Testing & Deployment (2-3 hours)
- Test authentication flow
- Test database operations
- Test payment flow
- Test webhook events
- Deploy to Vercel
- Configure production environment variables

**Total Estimated Time:** 12-18 hours

## Key Differences from Next.js

| Feature | Next.js Pattern | Vite + React Pattern |
|---------|----------------|---------------------|
| API Routes | `app/api/route.ts` | `api/endpoint.js` (Vercel Functions) |
| Server Actions | `'use server'` functions | Regular API endpoints |
| Middleware | `middleware.ts` | React Router loaders/guards |
| Auth Protection | Middleware intercepts | `<ClerkProvider>` + route checks |
| Supabase Client | Server-side with JWT injection | Client-side with Clerk token |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React SPA (Vite)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Clerk      │  │   Zustand    │  │   React      │     │
│  │   Context    │  │   Stores     │  │   Router     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
        ┌──────────┐  ┌──────────┐  ┌──────────────┐
        │  Clerk   │  │ Supabase │  │    Lemon   │
        │   Auth   │  │   API    │  │   Squeezy  │
        └──────────┘  └──────────┘  └──────────────┘
                            │
                            ▼
                ┌──────────────────────┐
                │ Vercel Functions     │
                │ - LemonSqueezy hooks │
                │ - Admin operations   │
                └──────────────────────┘
```

## Important Notes

### Security Considerations
- Never expose service/secret keys in client code
- Always validate user identity in serverless functions
- Use Supabase RLS policies as primary security layer
- Verify Lemon Squeezy webhook signatures using HMAC-SHA256

### Data Flow
1. User authenticates via Clerk
2. Clerk provides JWT with user ID
3. Supabase client uses JWT for authenticated requests
4. RLS policies enforce data access rules
5. Serverless functions handle privileged operations

### Migration Strategy
- Keep existing localStorage stores during development
- Gradually migrate to Supabase-backed stores
- Add sync functionality to push local data to cloud
- Implement optimistic updates for better UX

## Prerequisites

Before starting, ensure you have:
- [ ] Node.js 18+ installed
- [ ] Vercel account created
- [ ] Clerk account and application created
- [ ] Supabase project created
- [ ] Lemon Squeezy account created
- [ ] Git repository initialized

## Next Steps

Proceed to [Phase 1: Environment Setup](./01-environment-setup.md) to begin implementation.

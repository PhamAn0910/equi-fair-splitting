# Phase 1: Environment Setup & Dependencies

**Estimated Time:** 30 minutes

## 1.1 Create Service Accounts

### Clerk Setup
1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Choose authentication methods (Google, Email, etc.)
4. Go to **API Keys** in the dashboard
5. Copy the **Publishable Key** and **Secret Key**

### Supabase Setup
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for database provisioning (2-3 minutes)
4. Go to **Settings > API**
5. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbG...`)
   - **service_role key** (starts with `eyJhbG...`) - Keep this SECRET

### Lemon Squeezy Setup
1. Go to [lemonsqueezy.com](https://lemonsqueezy.com) and sign up
2. Create a new Store (or use existing one)
3. Go to **Settings > API** in your store dashboard
4. Create a new API key with full access
5. Copy:
   - **API Key** (starts with `eyJ0eXAi...`)
   - **Store ID** (found in Settings > Store)
6. Note: Start with Test Mode, switch to Live Mode for production

## 1.2 Install Dependencies

Run the following command to install all required packages:

```bash
# Core authentication and database
npm install @clerk/clerk-react @supabase/supabase-js

# Lemon Squeezy for payments
npm install @lemonsqueezy/lemonsqueezy.js

# Additional utilities
npm install date-fns crypto
```

## 1.3 Configure Environment Variables

Create or update `.env.local` in the project root:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Supabase Database
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Lemon Squeezy Payments
VITE_LEMONSQUEEZY_STORE_ID=12345

# App Configuration
VITE_APP_URL=http://localhost:5173
```

**Important Notes:**
- Use `VITE_` prefix for all client-accessible variables
- Never commit `.env.local` to git
- The `.env.local` file is already in `.gitignore`

## 1.4 Create Environment File for Serverless Functions

Create `.env` in the project root for serverless function secrets:

```bash
# Clerk Secret (for server-side verification)
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx

# Supabase Service Role Key (for admin operations)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Lemon Squeezy API Key
LEMONSQUEEZY_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.xxxxx

# Lemon Squeezy Webhook Secret (will be added later)
LEMONSQUEEZY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Gemini API Key (existing)
GEMINI_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# OpenRouter API Key (existing)
OPENROUTER_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```

## 1.5 Update .gitignore

Ensure these files are ignored:

```bash
# Environment files
.env
.env.local
.env*.local

# Vercel
.vercel
```

## 1.6 Verify Installation

Create a test file to verify packages are installed correctly:

```typescript
// test-imports.ts (temporary file, delete after verification)
import { ClerkProvider } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';
import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

console.log('✅ All packages imported successfully');
```

Run:
```bash
npx tsx test-imports.ts
```

If successful, you'll see: `✅ All packages imported successfully`

Delete `test-imports.ts` after verification.

## 1.7 Project Structure Preparation

Create folders for the new integration files:

```bash
mkdir -p src/lib/supabase
mkdir -p src/lib/stripe
mkdir -p api
mkdir -p src/types
```

Expected structure:
```
bill-painter/
├── api/                          # Vercel serverless functions
│   ├── lemonsqueezy-checkout.ts  # Create checkout session
│   └── lemonsqueezy-webhook.ts   # Handle Lemon Squeezy events
├── src/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabase client factory
│   │   │   └── types.ts          # Database types
│   │   └── lemonsqueezy/
│   │       └── client.ts         # Lemon Squeezy helpers
│   └── types/
│       └── database.ts           # TypeScript types for DB
└── docs/                         # This documentation
```

## 1.8 Checklist

Before moving to Phase 2, ensure:

- [ ] All service accounts created
- [ ] Environment variables configured in `.env.local` and `.env`
- [ ] All npm packages installed without errors
- [ ] `.gitignore` updated
- [ ] Project folders created
- [ ] Test imports verified

## Common Issues

### Issue: Vite not picking up environment variables
**Solution:** Ensure variables start with `VITE_` prefix and restart dev server

### Issue: Module not found errors
**Solution:** Delete `node_modules` and `package-lock.json`, then run `npm install`

### Issue: TypeScript errors with new packages
**Solution:** Run `npm install -D @types/node` if needed

## Next Steps

Once all items are checked off, proceed to [Phase 2: Clerk Authentication](./02-clerk-authentication.md).

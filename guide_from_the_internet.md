# Technical Integration Plan: Clerk, Supabase, and Stripe for the BillPaint Web App

## Introduction

This document outlines the strategic goal of integrating a robust, scalable, and secure backend infrastructure for the BillPaint application. This plan details the integration of Clerk for user authentication, Supabase for the database, and Stripe for subscription payments, providing a comprehensive guide for the development team. Following this plan will result in a production-ready application with distinct, manageable services for identity, data, and commerce.

---

## 1.0 Prerequisites and Environment Configuration

### 1.1 Initial Setup

Proper environment configuration is critical for a seamless and secure development workflow. The environment variables detailed below are the keys to connecting our application to the required third-party services. Misconfiguration can lead to failed connections, security vulnerabilities, and difficulties in debugging. This section centralizes all necessary credentials and keys.

### 1.2 Required Service Accounts

Before beginning the integration, the development team must create accounts and complete the initial setup for each of the following services:

* **Clerk:** A Clerk account and a new application instance must be created to obtain API keys.
* **Supabase:** A Supabase account and a new project are required to provision the database and obtain connection details.
* **Stripe:** A Stripe account with access to the developer dashboard is necessary for creating products and retrieving API keys.

### 1.3 Environment Variables

All necessary environment variables must be consolidated into a `.env.local` file in the project's root directory. The following table provides a comprehensive list of the variables required for this integration.

| Variable Name | Service | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | The public key for your Clerk application, used on the client-side. |
| `CLERK_SECRET_KEY` | Clerk | The secret key for your Clerk application, used on the server-side. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | The unique URL for your Supabase project's API. |
| `NEXT_PUBLIC_SUPABASE_KEY` | Supabase | The anon public key for your Supabase project. |
| `STRIPE_SECRET_KEY` | Stripe | The secret API key for your Stripe account, used for server-side operations. |
| `STRIPE_WEBHOOK_SECRET` | Stripe | The signing secret for your Stripe webhook endpoint to verify event authenticity. |

With the environment properly configured, we can proceed with the first major integration module: user authentication with Clerk.

---

## 2.0 Module 1: User Authentication with Clerk

### 2.1 Integrating the Clerk SDK

Clerk will serve as the single source of truth for user identity. Its pre-built components and hooks significantly accelerate development by providing a secure, feature-rich authentication foundation out of the box, including sign-in, sign-up, user profile management, and session handling.

The initial setup involves the following steps:

1.  Install the Clerk Next.js SDK.
2.  **Configure Environment Variables:** Add the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` obtained from your Clerk dashboard to your `.env.local` file, as referenced in the table in section 1.3.
3.  **Wrap the Application in ClerkProvider:** Modify the root `layout.tsx` file to import and wrap the application's children. This makes authentication state available throughout the entire app.
4.  **Create Authentication Middleware:** Create a `middleware.ts` file in the root of the project to protect application routes. This middleware will intercept all requests and ensure a user is authenticated before they can access any page, establishing a secure, private-first architecture.

With the basic SDK in place and pages protected, the next step is to secure the API endpoints that will handle application data.

### 2.2 Securing the Backend API

Client-side protection is insufficient; all backend API endpoints must independently verify user authentication on every request. This prevents unauthorized access even if client-side controls are bypassed. To secure an API route, use the `auth()` helper from Clerk to retrieve the current user's session on the server. If no authenticated user is found, the API must return a 401 Unauthorized error, halting the request.

The following demonstrates a protected API Route Handler in Next.js:

```typescript
// Example: app/api/protected-route/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Proceed with logic for authenticated users
  // You can safely use the userId here for database queries
  return NextResponse.json({ message: "This is a protected route.", user: userId });
}

```

This server-side check ensures that every API call is authenticated, forming a critical security layer for the application. We now shift from securing user identity to managing user data in Supabase.

---

## 3.0 Module 2: Database Integration with Supabase

### 3.1 Database Schema and RLS Policies

A well-defined database schema and robust Row-Level Security (RLS) are foundational for a multi-user application like BillPaint. RLS is a powerful PostgreSQL feature, fully exposed by Supabase, that enforces data access rules directly at the database level. This ensures that users can only create, read, update, or delete their own data, providing a critical layer of security that cannot be bypassed by the application code.

The following SQL script should be executed in the Supabase SQL Editor to define the necessary tables and enable RLS policies. These policies leverage the `auth.jwt() ->> 'sub'` function to securely extract the user's Clerk ID from the JSON Web Token (JWT) and compare it against the `user_id` column in each table.

```sql
-- Enable the UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create the 'groups' table
create table groups (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null, -- Stores the Clerk User ID
  name text not null,
  currency text default 'USD',
  created_at timestamptz default now()
);

-- Create the 'members' table
create table members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  name text not null
);

-- Create the 'expenses' table
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  description text not null,
  total_amount numeric not null,
  payer_id uuid references members(id),
  date timestamptz default now(),
  category text not null,
  splits jsonb not null
);

-- Create the 'subscriptions' table to store Stripe data
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, -- Clerk's user_id
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'Free',
  status text default 'free',
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS) on all tables
alter table groups enable row level security;
alter table members enable row level security;
alter table expenses enable row level security;
alter table subscriptions enable row level security;

-- Create RLS policies
create policy "Users can access their own groups" on groups
for all using (auth.jwt() ->> 'sub' = user_id);

create policy "Users can access members of their own groups" on members
for all using (group_id in (
  select id from groups where user_id = auth.jwt() ->> 'sub'
));

create policy "Users can access expenses within their own groups" on expenses
for all using (group_id in (
  select id from groups where user_id = auth.jwt() ->> 'sub'
));

create policy "Users can access their own subscription" on subscriptions
for all using (auth.jwt() ->> 'sub' = user_id);

```

With the database schema defined and secured, the next task is to configure the connection between Clerk and Supabase to ensure they trust each other.

### 3.2 Configuring Clerk as a Supabase Auth Provider

For Supabase RLS policies to correctly interpret the JWTs issued by Clerk, Clerk must be configured as a trusted third-party authentication provider within the Supabase dashboard. This is the modern, recommended integration method that replaces older, more complex JWT template configurations.

Follow these steps to complete the configuration:

1. Navigate to the Supabase integration page in the Clerk Dashboard.
2. Select your configuration options and click "Activate Supabase integration" to reveal your unique Clerk domain. Copy this value.
3. In the Supabase Dashboard, go to **Authentication > Providers**.
4. Click "Add provider" and select **Clerk**.
5. Paste the Clerk domain you copied in step 2 into the required field and save the configuration.

### 3.3 Creating an Authenticated Supabase Client

The application code requires a Supabase client instance that automatically passes the user's Clerk session token with every database request. This allows the RLS policies defined in the database to function correctly by authenticating and authorizing each operation.

The following TypeScript function provides a reusable, server-side client. It initializes the Supabase client and dynamically injects the Clerk JWT using the modern `auth().getToken()` method with the `supabase` template.

```typescript
// Example location: lib/supabase/server.ts
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function createServerSupabaseClient() {
  const { getToken } = auth();
  const supabaseToken = await getToken({ template: 'supabase' });

  if (!supabaseToken) {
    throw new Error('User is not authenticated or Supabase template is not configured.');
  }

  // The modern approach is to initialize the client with the user's access token
  // in the headers, which is then used for all subsequent requests.
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseToken}`,
        },
      },
    }
  );
}

```

With the data layer fully integrated and secured, we can now proceed to implement the payments and subscription layer.

---

## 4.0 Module 3: Payment and Subscription Integration with Stripe

### 4.1 Stripe Product and Webhook Configuration

Stripe will handle all payment processing and subscription management logic. The initial configuration involves defining the subscription products within the Stripe dashboard and setting up a webhook. The webhook is essential for allowing Stripe to communicate subscription state changes (e.g., successful payments, cancellations) back to our application in a reliable, asynchronous manner.

**A. Product Setup**

1. Navigate to the Product catalog in the Stripe Dashboard.
2. Create a new product (e.g., "BillPaint Pro").
3. Add a pricing plan to the product, selecting "Recurring" payments (e.g., $5/month). Note the Price ID (prefixed with `price_...`) for use in the application code.

**B. Webhook Endpoint Setup**

1. Navigate to the Webhooks section in the Stripe Dashboard.
2. Click "Add an endpoint".
3. Set the endpoint URL to the application's API route designated for handling webhooks (e.g., `https://<your-domain>/api/stripe-webhook`).
4. Configure the endpoint to listen for the following essential events:
* `checkout.session.completed`
* `customer.subscription.updated`
* `customer.subscription.deleted`


5. After the endpoint is created, copy the Signing secret (prefixed with `whsec_...`) and add it to your `.env.local` file as `STRIPE_WEBHOOK_SECRET`.

### 4.2 Building the Subscription Flow

The subscription flow redirects the user to a secure, Stripe-hosted checkout page. This process is initiated from a server-side action within the Next.js application, ensuring that sensitive operations and API keys remain secure on the server.

1. Install the Stripe Node.js library.
2. **Create the Server Action (createCheckoutSession):** Using a server action keeps our Stripe secret key secure and prevents client-side manipulation. This function authenticates the user, creates a checkout session with the specified product, and redirects the user to the Stripe-hosted page.

### 4.3 Handling Subscription State via Webhooks

Using webhooks is the most reliable method for managing subscription status. The application's webhook handler must be designed to listen for events from Stripe and update the subscriptions table in Supabase accordingly, ensuring that the application's user data is always synchronized with Stripe's billing state.

The logic for the `/api/stripe-webhook` API route should perform the following actions:

1. Verify the authenticity of the incoming request by checking its signature against the `STRIPE_WEBHOOK_SECRET`.
2. Parse the event body to extract the event object.
3. Use a switch statement to handle different `event.type` values (e.g., `checkout.session.completed`, `customer.subscription.updated`).
4. For each relevant event, extract the necessary data, such as `stripe_customer_id`, `stripe_subscription_id`, `status`, and `current_period_end`.
5. Use an authenticated Supabase client to upsert (update or insert) the subscription data into the subscriptions table, associating it with the correct user.
6. Return a 200 OK response immediately to acknowledge successful receipt of the event to Stripe.

With all three services configured and interconnected, the final step is to integrate their functionality into the BillPaint application's UI and state management.

---

## 5.0 Application-Level Integration

### 5.1 Updating Zustand Stores for Data Persistence

The existing client-side Zustand stores, which are central to BillPaint's state management, must be enhanced to synchronize their state with the Supabase database. This critical step ensures data persistence across user sessions and devices. The correct pattern is to define data-fetching and mutation logic in Next.js Server Actions and then call these actions from the client-side store, respecting the client-server boundary.

First, create Server Actions for database operations:

```typescript
// Example location: app/actions/groups.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function syncGroups() {
  const { userId } = auth();
  if (!userId) throw new Error('User not authenticated');

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('groups').select('*').eq('user_id', userId);
  
  if (error) throw new Error('Failed to fetch groups');
  return data;
}

export async function saveGroup(group: any) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('groups').upsert(group);

  if (error) throw new Error('Failed to save group');
  return { success: true };
}

```

Next, modify the Zustand store to call these server actions:

```typescript
// Example location: stores/groupStore.ts
import { create } from 'zustand';
import { syncGroups, saveGroup } from '@/app/actions/groups';

// ... existing store state and non-async actions

// Example of integrating server actions into the client-side store
export const useGroupStore = create((set) => ({
  groups: [],
  // Action to fetch groups from the server and update the client state
  fetchGroups: async () => {
    try {
      const serverGroups = await syncGroups();
      set({ groups: serverGroups });
    } catch (error) {
      console.error("Failed to sync groups:", error);
    }
  },
  // Action to save a group via server action, then re-fetch
  persistGroup: async (group: any) => {
    try {
      await saveGroup(group);
      // Optional: re-fetch all groups to ensure client state is consistent
      await useGroupStore.getState().fetchGroups(); 
    } catch (error) {
      console.error("Failed to save group:", error);
    }
  },
}));

```

### 5.2 UI Integration and Final Steps

To complete the integration, the following UI and logic components must be implemented, connecting the backend services to the user experience:

* **Header Component:** Use Clerk's `<SignedIn>` and `<SignedOut>` control components to conditionally render a "Sign In" button for guests or a `<UserButton>` for authenticated users, which provides access to account management and sign-out functionality.
* **Protected Pages:** While the middleware provides route-level protection, individual pages should still verify the user's session state to gracefully handle loading states and potential edge cases.
* **Subscription UI:** Implement a UI element, such as a "Upgrade to Pro" button on a pricing page or within the app, that invokes the `createCheckoutSession` server action. This action will initiate the Stripe subscription flow.
* **Feature Gating:** Implement logic within the application that reads the user's subscription status from the Supabase subscriptions table. This data will be used to conditionally enable or disable premium features, ensuring that only subscribed users can access paid functionality in the BillPaint app.
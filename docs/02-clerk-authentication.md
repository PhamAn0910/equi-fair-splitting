# Phase 2: Clerk Authentication

**Estimated Time:** 2-3 hours

## 2.1 Install Clerk SDK

If you haven't already:
```bash
npm install @clerk/clerk-react
```

## 2.2 Configure Clerk Provider

Edit `src/main.tsx` (or your root entry file) to wrap the app with `ClerkProvider`.

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
```

## 2.3 Create Auth Components

Create a new folder `src/components/auth`.

### 2.3.1 ProtectedRoute Component

Create `src/components/auth/ProtectedRoute.tsx`:

```typescript
import { useAuth, RedirectToSignIn } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return <Outlet />;
}
```

## 2.4 Update Router Configuration

Modify `src/App.tsx` to protect your main routes.

```typescript
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/scan" element={<ScanPaint />} /> 
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
             <Route path="/dashboard" element={<Dashboard />} />
             <Route path="/groups" element={<Groups />} />
             <Route path="/group/:groupId" element={<GroupDetail />} />
             <Route path="/bill/:billId" element={<BillDetail />} />
             <Route path="/account" element={<Account />} />
             <Route path="/settle" element={<Settlement />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
```

*(Note: Adjust the route protection based on which pages you want to be public vs private. Typically `scan` might be public for trial, but `groups` should be private.)*

## 2.5 Update UI Components

### 2.5.1 Update Account Page
Modify `src/pages/Account.tsx` to show the generic Clerk User Profile.

```typescript
import { UserProfile } from "@clerk/clerk-react";

export default function Account() {
  return (
    <div className="flex justify-center p-4 pb-24">
      <UserProfile />
    </div>
  );
}
```

### 2.5.2 Add Header Auth Buttons
In your `Dashboard.tsx` or main layout/header, add the UserButton.

```typescript
import { UserButton, useUser } from "@clerk/clerk-react";

// In your render:
<header className="flex justify-between items-center p-4">
  <h1>BillPainter</h1>
  <UserButton afterSignOutUrl="/" />
</header>
```

## 2.6 Sync User to Local Store (Optional but Recommended)

You might want to store the Clerk user ID in your Zustand store to easier access without hooks in non-component files.

Edit `src/stores/settingsStore.ts` or create a new `userStore.ts`.

## 2.7 Testing Phase 2

1. Run `npm run dev`
2. Try to access `/dashboard` -> Should redirect to Clerk Sign In
3. Sign in with Google/Email
4. You should be redirected back to Dashboard
5. Click User Icon -> Should see Clerk Profile modal
6. Sign Out -> Should go to Home

## Checklist

- [ ] `ClerkProvider` configured in `main.tsx`
- [ ] `ProtectedRoute` created
- [ ] Routes protected in `App.tsx`
- [ ] Account page updated with `UserProfile`
- [ ] UserButton added to headers

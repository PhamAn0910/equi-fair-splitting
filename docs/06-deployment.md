# Phase 6: Deployment & Production

**Estimated Time:** 2-3 hours

## 6.1 Production Environment Variables

You need to set up the environment variables in Vercel.

1. Go to **Vercel Dashboard -> Your Project -> Settings -> Environment Variables**.
2. Add all variables from `.env.local` and `.env`.

| Key | Value Source |
|-----|--------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk (Production Instance) |
| `CLERK_SECRET_KEY` | Clerk (Production Instance) |
| `VITE_SUPABASE_URL` | Supabase |
| `VITE_SUPABASE_ANON_KEY` | Supabase |
| `SUPABASE_SERVICE_KEY` | Supabase |
| `VITE_LEMONSQUEEZY_STORE_ID` | Lemon Squeezy Store ID |
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy (Live Mode) |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Lemon Squeezy Webhook |
| `VITE_APP_URL` | `https://your-project.vercel.app` |

**Important:** For production, you should create a **Production** instance in Clerk and toggle Lemon Squeezy to **Live Mode**. Do not reuse test keys for real money!

## 6.2 Configure Lemon Squeezy Webhook (Production)

1. Go to **Lemon Squeezy Dashboard (Live Mode) -> Settings -> Webhooks**.
2. Click **Add Endpoint**.
3. Enter URL: `https://your-project.vercel.app/api/lemonsqueezy-webhook`
4. Select events:
   - `order_created`
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
   - `subscription_payment_failed`
5. Copy the **Signing Secret** and add to Vercel Env Vars as `LEMONSQUEEZY_WEBHOOK_SECRET`.

## 6.3 Deploy

```bash
git add .
git commit -m "feat: complete backend integration"
git push
```

If Vercel is connected to your Git repo, it will auto-deploy.
Otherwise run:
```bash
vercel --prod
```

## 6.4 Verification Steps

1. **Auth:** Sign Up on the deployed site. Check if user appears in Clerk Prod dashboard.
2. **Database:** Create a Group. Check if it appears in Supabase Prod table.
3. **Payments:** **WARNING:** Use a real card for a small amount (create a $0.50 test product) OR use a 100% off coupon to test the flow without spending money.
4. **Subscription:** Verify `user_subscriptions` table updates after "payment".

## 6.5 Troubleshooting

- **500 Errors on API:** Check Vercel Function Logs. usually missing env vars.
- **CORS Errors:** Vercel functions are same-origin, so usually fine. If calling from elsewhere, configure headers.
- **Webhook Fails:** Check signature verification. Ensure raw body is preserved.

## Final Handoff

Your app is now a full-stack SaaS with Authentication, Database, and Payments!

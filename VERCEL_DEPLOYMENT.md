# Vercel Deployment Guide

This guide will help you deploy your Next.js application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. Your project repository pushed to GitHub, GitLab, or Bitbucket
3. All required API keys and credentials

## Step 1: Environment Variables

Before deploying, you need to configure the following environment variables in Vercel:

### Required Environment Variables

1. **Google OAuth** (for admin authentication)
   - `GOOGLE_CLIENT_ID` - Server-side Google OAuth client ID
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Client-side Google OAuth client ID (same value)
   - Get these from: https://console.cloud.google.com/apis/credentials

2. **Stripe** (for payments)
   - `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_test_` for test, `sk_live_` for production)
   - `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret (starts with `whsec_`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (starts with `pk_test_` or `pk_live_`)
   - Get these from: https://dashboard.stripe.com/apikeys

### Optional Environment Variables

3. **Email Service** (choose one: Resend or SendGrid)
   
   **Resend (Recommended):**
   - `RESEND_API_KEY` - Your Resend API key (starts with `re_`)
   - `RESEND_FROM_EMAIL` - Email address to send from (must be verified in Resend)
   - Get these from: https://resend.com/api-keys

   **SendGrid (Alternative):**
   - `SENDGRID_API_KEY` - Your SendGrid API key (starts with `SG.`)
   - `SENDGRID_FROM_EMAIL` - Email address to send from (must be verified in SendGrid)
   - Get these from: https://app.sendgrid.com/settings/api_keys

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure your project:
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: Leave as default (`.`)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add all the variables listed in Step 1
   - Make sure to add them for all environments (Production, Preview, Development)

5. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 3: Configure Stripe Webhook

After deployment, you need to configure your Stripe webhook:

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.vercel.app/api/stripe/webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
5. Copy the "Signing secret" and add it to Vercel as `STRIPE_WEBHOOK_SECRET`

## Step 4: Configure Google OAuth Redirect URI

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - `https://your-domain.vercel.app`
   - `https://your-domain.vercel.app/api/auth/google/callback`

## Step 5: Verify Deployment

After deployment, verify:

1. ✅ Site loads at your Vercel URL
2. ✅ Admin authentication works
3. ✅ Stripe checkout works (test with test card: `4242 4242 4242 4242`)
4. ✅ Email sending works (test newsletter subscription)
5. ✅ Images upload correctly
6. ✅ All API routes respond correctly

## Important Notes

- **Admin Credentials**: Currently hardcoded in `src/lib/auth.ts`. Consider moving to environment variables for better security.
- **Font Loading**: Google Fonts (Geist) will be loaded automatically by Next.js during build. Font loading errors during local builds are normal if you're offline.
- **Data Storage**: The app uses JSON files in the `/data` directory. For production, consider migrating to a database (PostgreSQL, MongoDB, etc.).
- **File Uploads**: Uploaded images are stored in `/public/uploads`. Consider using a cloud storage service (AWS S3, Cloudinary, etc.) for production.

## Troubleshooting

### Build Fails

- Check that all environment variables are set in Vercel
- Review build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`

### Stripe Webhook Not Working

- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check webhook endpoint URL is correct in Stripe dashboard
- Review Vercel function logs for errors

### Google OAuth Not Working

- Verify both `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` are set
- Check redirect URIs in Google Cloud Console
- Ensure the email matches the admin email in `src/lib/auth.ts`

### Email Not Sending

- Verify either Resend or SendGrid API keys are set
- Check the "from" email is verified in your email service
- Review Vercel function logs for email errors

## Next Steps

- Set up a custom domain in Vercel
- Configure CI/CD for automatic deployments
- Set up monitoring and error tracking (Sentry, etc.)
- Migrate to a production database
- Set up cloud storage for file uploads
- Configure CDN for static assets

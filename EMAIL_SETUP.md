# Email Setup Guide

## Problem
Emails are not being sent after orders are placed because no email service is configured.

## Solution Options

### Option 1: Resend (Recommended - Easiest)

**Why Resend?**
- Free tier: 3,000 emails/month
- Easy setup
- Great developer experience
- No credit card required for free tier

**Setup Steps:**

1. **Sign up for Resend:**
   - Go to https://resend.com
   - Sign up for free account
   - Verify your email

2. **Get API Key:**
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Copy the API key (starts with `re_`)

3. **Verify Domain (Optional but recommended):**
   - Go to https://resend.com/domains
   - Add your domain
   - Add DNS records as instructed
   - Or use `onboarding@resend.dev` for testing (limited)

4. **Add to `.env.local`:**
   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=orders@yourdomain.com
   # Or for testing:
   # RESEND_FROM_EMAIL=onboarding@resend.dev
   ```

5. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Option 2: SendGrid

**Why SendGrid?**
- Free tier: 100 emails/day
- More features
- Enterprise options

**Setup Steps:**

1. **Sign up for SendGrid:**
   - Go to https://sendgrid.com
   - Sign up for free account
   - Verify your email

2. **Create API Key:**
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Give it "Full Access" or "Mail Send" permissions
   - Copy the API key

3. **Verify Sender:**
   - Go to Settings > Sender Authentication
   - Verify a single sender or domain
   - Use verified email as FROM address

4. **Add to `.env.local`:**
   ```env
   SENDGRID_API_KEY=SG.your_api_key_here
   SENDGRID_FROM_EMAIL=orders@yourdomain.com
   ```

5. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Option 3: Other Services

You can also use:
- **AWS SES** - For AWS users
- **Mailgun** - Alternative service
- **Postmark** - Transactional emails
- **Nodemailer with SMTP** - Custom SMTP server

## Testing

After setup:

1. **Place a test order**
2. **Check your email** (and spam folder)
3. **Check server logs** for email sending status
4. **Verify email content** looks correct

## Troubleshooting

### "Email service not configured"
- Check `.env.local` has the API key
- Verify key is correct (no extra spaces)
- Restart dev server after adding env vars

### "Invalid API key"
- Verify key is correct
- Check key hasn't expired
- Ensure no extra spaces or quotes

### "Email not received"
- Check spam/junk folder
- Verify email address is correct
- Check server logs for errors
- Verify domain/sender is verified (for Resend/SendGrid)

### "Rate limit exceeded"
- Free tiers have limits
- Wait or upgrade plan
- Check email service dashboard

## Current Status

The email system will:
- ✅ Try Resend first (if configured)
- ✅ Fall back to SendGrid (if configured)
- ✅ Log to console if neither is configured
- ✅ Not fail order creation if email fails

## Quick Start (Resend)

```bash
# 1. Sign up at https://resend.com
# 2. Get API key from dashboard
# 3. Add to .env.local:
echo "RESEND_API_KEY=re_your_key_here" >> .env.local
echo "RESEND_FROM_EMAIL=onboarding@resend.dev" >> .env.local
# 4. Restart server
npm run dev
```

That's it! Emails will now be sent automatically.

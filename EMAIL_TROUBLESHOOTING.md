# Email Troubleshooting Guide

## Your Current Configuration

Based on your `.env.local` file:
- ✅ RESEND_API_KEY is set
- ✅ RESEND_FROM_EMAIL is set to `info@scorchedfabrics.com`

## Common Issues & Solutions

### 1. **Server Not Restarted** ⚠️ MOST COMMON
After adding environment variables to `.env.local`, you **MUST** restart your Next.js dev server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

**Why?** Next.js only loads environment variables when the server starts.

### 2. **Domain Not Verified in Resend** ⚠️ VERY COMMON
If you're using `info@scorchedfabrics.com`, you need to:

1. **Verify your domain in Resend:**
   - Go to https://resend.com/domains
   - Click "Add Domain"
   - Add `scorchedfabrics.com`
   - Add the DNS records they provide to your domain's DNS settings
   - Wait for verification (can take a few minutes to 24 hours)

2. **OR use Resend's test domain for now:**
   - Change `RESEND_FROM_EMAIL` to `onboarding@resend.dev` in `.env.local`
   - Restart server
   - This works immediately but has limitations

### 3. **Check Server Logs**
When you try to send an email, check your terminal/console for logs. The improved error handling will show:
- ✅ "Email sent successfully via Resend" if it works
- ❌ Detailed error messages if it fails

### 4. **Test Email Endpoint**
I've created a test endpoint. While logged into admin, visit:

```
http://localhost:3000/api/test-email?email=your-email@example.com
```

This will:
- Show your configuration
- Test sending an email
- Show detailed error messages if it fails

### 5. **Verify API Key**
Make sure your API key:
- Starts with `re_`
- Has no extra spaces or quotes
- Is the correct key from https://resend.com/api-keys

### 6. **Check Email Status in Resend Dashboard**
1. Go to https://resend.com/emails
2. Check if emails are being sent
3. See delivery status and any errors

## Quick Fixes

### Option A: Use Test Domain (Immediate Fix)
```env
RESEND_API_KEY=re_amW514X3_9M6mJz7MKwt1ggpLu7tLuZ8m
RESEND_FROM_EMAIL=onboarding@resend.dev
```
Then restart server.

### Option B: Verify Domain (Proper Fix)
1. Go to https://resend.com/domains
2. Add `scorchedfabrics.com`
3. Add DNS records (SPF, DKIM, DMARC)
4. Wait for verification
5. Keep using `info@scorchedfabrics.com`

## Debugging Steps

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Check if variables are loaded:**
   - Visit test endpoint while logged in as admin
   - Or check server logs when sending email

3. **Test sending an email:**
   - Place a test order OR
   - Use the test endpoint: `/api/test-email?email=your-email@example.com`

4. **Check the response:**
   - Look at the response body for detailed error messages
   - Check server terminal for logs
   - Check Resend dashboard for email status

## Still Not Working?

If emails still aren't sending:

1. **Check browser console and server logs** for error messages
2. **Verify the API key** is correct in Resend dashboard
3. **Test with onboarding@resend.dev** to rule out domain issues
4. **Check Resend dashboard** at https://resend.com/emails to see if emails are attempted
5. **Check spam folder** - sometimes emails are sent but marked as spam

## Error Messages Explained

- **"Unauthorized"** → API key is wrong or invalid
- **"Invalid domain"** → Domain not verified, use `onboarding@resend.dev` or verify domain
- **"Forbidden"** → API key doesn't have email sending permissions
- **"Rate limit exceeded"** → Too many emails sent (free tier limits)

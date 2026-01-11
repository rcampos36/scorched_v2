# Stripe Payment Integration Setup

This project uses Stripe as the payment gateway. Follow these steps to set up Stripe:

## 1. Install Dependencies

Run the following command to install Stripe packages:

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

## 2. Get Your Stripe API Keys

1. Sign up for a Stripe account at https://stripe.com
2. Go to the [Stripe Dashboard](https://dashboard.stripe.com)
3. Navigate to **Developers** > **API keys**
4. Copy your **Publishable key** and **Secret key**
   - For testing, use the test mode keys (start with `pk_test_` and `sk_test_`)
   - For production, use the live mode keys (start with `pk_live_` and `sk_live_`)

## 3. Set Up Environment Variables

Create a `.env.local` file in the root of your project (if it doesn't exist) and add:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Important:** 
- Never commit `.env.local` to version control
- Use test keys during development
- Switch to live keys only in production

## 4. Set Up Webhook (For Production)

1. In Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** and add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Testing Webhooks Locally

For local development, use Stripe CLI:

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Or download from https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will provide a webhook signing secret starting with `whsec_` - use this for local testing.

## 5. Test the Integration

1. Use Stripe test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`
2. Use any future expiry date (e.g., 12/34)
3. Use any 3-digit CVC
4. Use any ZIP code

## 6. Payment Flow

1. User fills out checkout form
2. System creates a Payment Intent via `/api/stripe/create-payment-intent`
3. User enters payment details in Stripe Elements form
4. Payment is processed
5. On success:
   - Order is created via `/api/orders`
   - User is redirected to success page
   - Confirmation email is sent
6. Webhook handles payment status updates

## Troubleshooting

- **"Stripe is not configured"**: Check that `STRIPE_SECRET_KEY` is set in `.env.local`
- **Payment fails**: Check Stripe Dashboard > Payments for error details
- **Webhook not working**: Verify webhook URL and signing secret
- **CORS errors**: Ensure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly

## Security Notes

- Never expose your secret key in client-side code
- Always validate webhook signatures
- Use HTTPS in production
- Keep your API keys secure and rotate them regularly

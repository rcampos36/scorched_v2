# Scorched V2 - Custom T-Shirts & Apparel E-Commerce Platform

A full-featured Next.js e-commerce platform for custom t-shirts and apparel with admin dashboard, payment processing, and customer customization.

## Features

- 🛍️ **E-Commerce Platform** - Custom t-shirt and apparel ordering
- 🎨 **Product Customization** - Customers can upload graphics and customize products
- 💳 **Payment Processing** - Integrated Stripe payments
- 👤 **Admin Dashboard** - Full CMS for managing products, slides, and content
- 📧 **Email Notifications** - Order confirmations and shipping notifications
- 🔐 **Authentication** - Admin and customer authentication systems
- 📱 **Responsive Design** - Mobile-friendly interface

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/scorched_v2.git
   cd scorched_v2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your API keys (see Configuration section below)

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Configuration

Before running the application, you need to configure the following environment variables. Copy `.env.example` to `.env.local` and fill in your values:

### Required for Production

- **Google OAuth** - For admin authentication
- **Stripe** - For payment processing
- **Email Service** - For sending notifications (Resend or SendGrid)

See `.env.example` for all required variables and their descriptions.

### Setup Guides

- 📖 **[Vercel Deployment](./VERCEL_DEPLOYMENT.md)** - Deploy to Vercel
- 📖 **[Hostinger Deployment](./HOSTINGER_DEPLOYMENT.md)** - Deploy to Hostinger VPS
- 📖 **[Image Upload Setup](./IMAGE_UPLOAD_SETUP.md)** - Configure image uploads
- 📖 **[Email Setup](./EMAIL_SETUP.md)** - Configure email service
- 📖 **[Stripe Setup](./STRIPE_SETUP.md)** - Configure payments

## Project Structure

```
scorched_v2/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── admin/        # Admin dashboard pages
│   │   ├── api/          # API routes
│   │   └── checkout/     # Checkout pages
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   └── lib/              # Utility functions
├── public/               # Static files
│   └── uploads/          # Uploaded images (git-ignored)
├── data/                 # JSON data files
└── docs/                 # Documentation files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Technology Stack

- **Framework:** Next.js 16
- **UI:** React 19, Tailwind CSS
- **Payments:** Stripe
- **Authentication:** Custom auth + Google OAuth
- **File Storage:** Local filesystem (VPS) or Cloud storage (Vercel)
- **Email:** Resend or SendGrid

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

**📖 See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions including:**
- Required environment variables
- Stripe webhook configuration
- Google OAuth setup
- Email service configuration
- Troubleshooting guide

**📖 See [HOSTINGER_DEPLOYMENT.md](./HOSTINGER_DEPLOYMENT.md) for deploying to Hostinger VPS/Cloud hosting**

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Email Sending

Admin onboarding links are sent automatically through Resend. Add these values
to `.env.local` and to your production environment:

```bash
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=InfoSync <onboarding@your-domain.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use a verified Resend domain for `RESEND_FROM_EMAIL` before sending to real
customers.

## Audit And Consent Tables

Customer consent and system history need the database tables in:

```text
supabase/migrations/202605070001_audit_and_consent.sql
```

Run that SQL in the Supabase SQL editor before relying on consent history or
system action history in production.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

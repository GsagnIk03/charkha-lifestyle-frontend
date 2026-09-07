# Atelier — Frontend

React + TypeScript, built with Vite. Routing matches the pages in the
[approved design canvas](https://claude.ai/code/artifact/0a1f84d7-6dee-43e5-8d32-6c514f68b1a1).

The API this talks to, and all the AWS infrastructure (including the S3
bucket + CloudFront distribution this repo's own build gets deployed to),
live in the separate **atelier-backend** repo — see its `infra/` folder.

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend
npm run dev
```

## Structure

- `src/pages/` — one file per route (Home, Listing, ProductDetail, Cart,
  Checkout, Login, AdminDashboard, TeamEdit).
- `src/api/client.ts` — fetch wrapper; will take a Cognito access token once
  auth is wired up.
- `src/api/types.ts` — TypeScript types mirroring the **atelier-backend**
  repo's `app/models.py` Pydantic models. Keep the two in sync by hand,
  across repos, until there's a shared schema.
- `src/styles/tokens.css` — the color/type tokens from the design canvas
  (oklch palette, Libre Caslon Display + Public Sans). Reference these
  variables in new components rather than hardcoding values.

## Still stubbed out

- Cart state (no store/context yet — `Cart.tsx` and `Checkout.tsx` are
  placeholders).
- Cognito auth (`Login.tsx` has the form but no real sign-in call yet).
- Razorpay Checkout widget on the checkout page.
- Role-based route guarding for `/admin` and `/admin/inventory/*/edit`.
- Pixel-level fidelity to the mockups (current pages are functional
  skeletons, not the final visual design).

## Deploy

Build output (`npm run build` → `dist/`) is a static bundle meant for the
S3 bucket + CloudFront distribution defined in **atelier-backend**'s
`infra/template.yaml` (deploy that stack first — its Outputs give you the
bucket name and distribution ID). Then, from this repo:

```bash
npm run build
aws s3 sync dist/ s3://<FrontendBucket from the backend stack's Outputs> --delete
aws cloudfront create-invalidation --distribution-id <FrontendDistribution ID> --paths "/*"
```

Worth wiring into this repo's own CI (GitHub Actions) once you're
deploying more than occasionally — see the [architecture blueprint](https://claude.ai/code/artifact/12f6ab68-e085-4a6e-a121-054fd3b25b0a)
for the full picture of how the two repos fit together.

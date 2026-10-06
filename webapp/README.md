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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on Railway

The app lives in the `webapp/` folder of the repository, so the Railway service has to be
pointed at it. Without this, the builder only sees the repo root (spreadsheets and PDFs)
and fails with *"Railpack could not determine how to build the app"*.

1. **Settings → Source → Root Directory**: `webapp`
2. **Variables**: `DATABASE_URL` — an absolute SQLite path on the mounted volume, e.g.
   `file:/data/prod.db`
3. **Volumes**: mount a volume at `/data` so the database survives redeploys
4. **Networking**: expose port `3000` (Railway injects `PORT`, which `next start` honours)

No custom build or start command is needed — the `package.json` scripts cover it:

- `postinstall` runs `prisma generate` (the generated client is gitignored)
- `start` runs `prisma migrate deploy` before `next start`, so migrations apply on boot

### Known limitation: photo uploads

Uploaded photos are written to `public/uploads` on the container's local disk, which is
wiped on every redeploy and is not shared between replicas. Move `saveUploadedPhoto` in
`app/lib/upload.ts` to object storage (S3/R2/Vercel Blob) before relying on it in
production.

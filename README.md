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

## Environment Configuration

This project uses a custom environment loader so that only one environment file is applied at runtime.

1. Set `NODE_ENV` in `.env` with one of: `local`, `dev`, `stage`, `prod`.
1. The app then loads only `.env.${NODE_ENV}`.
1. No other `.env*` files are loaded by Next.js.

Example:

```txt
# .env
NODE_ENV=local
```

This will load only `.env.local` for application configuration.

Available files:

- `.env` (selector only)
- `.env.local`
- `.env.dev`
- `.env.stage`
- `.env.prod`

> Note: Internally, Next.js still runs with its own runtime mode (`development` for `next dev`, `production` for `next build/start`) so framework behavior remains correct.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on GitHub Pages

This project is configured for GitHub Pages static deployment.

### Included configuration

- `next.config.ts`
	- `output: "export"`
	- `trailingSlash: true`
	- `images.unoptimized: true` (required for static export + `next/image`)
	- `basePath` and `assetPrefix` from `NEXT_PUBLIC_BASE_PATH`
- `.github/workflows/deploy.yml`
	- Builds and exports the app to `out/`
	- Uploads artifact and deploys via GitHub Pages Actions
	- Uses `NEXT_PUBLIC_BASE_PATH=/mensa-empresarios`

### One-time GitHub repository setting

In your GitHub repository:

1. Go to `Settings` -> `Pages`.
2. In `Build and deployment`, set `Source` to `GitHub Actions`.

After that, every push to `main` triggers deployment.

Your app will be available at:

- `https://newen-ai.github.io/mensa-empresarios/`

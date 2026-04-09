# @aucra/vercel

The official Vercel SDK for **Aucra** — The platform to successfully monetize AI web scrapers and traffic.

This SDK works with **any framework on Vercel** — Astro, Svelte, Vue, Nuxt, Remix, plain HTML, and more — by deploying as Vercel Routing Middleware.

## Installation

```bash
npm install @aucra/vercel
```

## Quick Start

### 1. Create `middleware.ts` in your project root

```typescript
// middleware.ts
import { createAucraMiddleware } from '@aucra/vercel';

const aucra = createAucraMiddleware({
  publisherKey: process.env.AUCRA_KEY,
});

export default aucra;
```

### 2. Set environment variable

In your Vercel project dashboard, add `AUCRA_KEY` with your publisher key.

## Framework-Specific Setup

### Astro

Works with Astro's SSR adapter on Vercel. Create `middleware.ts` in your project root (same level as `astro.config.mjs`).

### SvelteKit

Works with SvelteKit on Vercel. Create `middleware.ts` in your `src/` directory (or `hooks.server.ts` for server-only logic).

### Nuxt

Works with Nuxt on Vercel. Create `middleware.ts` at project root - Nuxt will automatically use it.

### Vue / Nuxt 3

Same as above.

### Remix

Works with Remix on Vercel. Create `middleware.ts` at project root.

### Plain HTML/JS

Works with any static or SSR site on Vercel.

## How It Works

1. **Zero Overhead for Humans**: When a normal human visits, the middleware passes through immediately with `0ms` added latency.
2. **Bot Detection**: The middleware checks the `User-Agent` header against 40+ AI scrapers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.).
3. **Live Auctions**: When a bot is detected, the middleware performs a lightweight Edge fetch to the Aucra SSP API with a 100ms timeout.
4. **Ad Injection**: If your publisher key wins an auction, the ad content is injected into the HTML before `</body>`.

## Configuration

```typescript
createAucraMiddleware({
  // Publisher key (or set AUCRA_KEY env var)
  publisherKey: process.env.AUCRA_KEY,

  // Optional: Custom SSP endpoint
  sspUrl: 'https://your-ssp-endpoint.com/v1/edge/auction',

  // Optional: SSP call timeout in ms (default: 100)
  timeoutMs: 100,
})
```

## Live Vercel Logs

The SDK prints detailed runtime traces. Open Vercel Dashboard → **Logs** to watch:

```
========================================
[AUCRA] Edge Auction Request Initiated
[AUCRA] URL Executing: https://your-domain.com/
[AUCRA] AI agent detected — UA="Mozilla/5.0 ... PerplexityBot/1.0"
[AUCRA] Calling SSP: https://aucra-ssp-api...
[AUCRA] Auction Result: WINNER FOUND!
[AUCRA] Ad Text: "Try Aucra - Monetize your AI traffic"
========================================
```

## Detected AI Bots

- **OpenAI**: GPTBot, ChatGPT-User, ChatGPT-Agent
- **Anthropic**: ClaudeBot, Claude-Web, Claude-User
- **Google**: Google-Extended, Googlebot-Extended, GoogleOther, Vertex AI
- **Perplexity**: PerplexityBot, Perplexity-User
- **Meta**: Meta-ExternalAgent, Meta-ExternalFetcher
- **Apple**: Applebot-Extended
- **Amazon**: Amazonbot
- **Cohere**: cohere-ai, cohere-training-data-crawler
- **ByteDance**: Bytespider
- **Exa/Linkup**: ExaBot, LinkupBot
- **Firecrawl**: FirecrawlAgent, webzio-extended
- **Apify**: ApifyWebsiteContentCrawler
- **And 30+ more...**

## Comparison: @aucra/next vs @aucra/vercel

| Aspect | @aucra/next | @aucra/vercel |
|--------|-------------|---------------|
| Frameworks | Next.js only | Any framework on Vercel |
| Integration | React component in layout | `middleware.ts` at root |
| API | `next/headers()` | Standard Web APIs |
| React Required | Yes | No |
| SDK Type | React Server Component | Edge Middleware |

## Developer Notes

This package is framework-agnostic TypeScript. To build:

```bash
npm install
npm run build
```

The source is in `src/middleware.ts` - no compilation required for direct use with Vercel.

## Publishing

GitHub Actions CI/CD pipeline. To publish:

1. Commit changes to `main` branch
2. `npm version patch` (or minor/major)
3. `git push --follow-tags`
4. GitHub Action builds and publishes to NPM automatically

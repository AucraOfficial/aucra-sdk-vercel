/**
 * Aucra Edge Middleware for Vercel
 *
 * Framework-agnostic middleware that works with Astro, Svelte, Vue, Nuxt, Remix, etc.
 * Deploy to Vercel as `middleware.ts` in your project root.
 *
 * Install: npm install @aucra/vercel
 */

const AI_UA_PATTERNS = [
  // OpenAI
  'GPTBot',
  'ChatGPT-User',
  'ChatGPT-Agent',

  // Anthropic
  'ClaudeBot',
  'Claude-Web',
  'Claude-User',
  'anthropic-ai',

  // Google
  'Google-Extended',
  'Googlebot-Extended',
  'Google-CloudVertexBot',
  'GoogleOther',
  'Google-NotebookLM',
  'GoogleAgent-Mariner',

  // Perplexity
  'PerplexityBot',
  'Perplexity-User',

  // Meta
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',

  // Apple
  'Applebot-Extended',

  // Amazon
  'Amazonbot',
  'AmazonBuyForMe',

  // Cohere
  'cohere-ai',
  'cohere-training-data-crawler',

  // ByteDance
  'Bytespider',

  // You.com
  'YouBot',

  // Diffbot
  'Diffbot',

  // CommonCrawl
  'CCBot',

  // Phind
  'PhindBot',

  // DuckDuckGo
  'DuckAssistBot',

  // Kagi
  'kagi-fetcher',

  // Klaviyo
  'KlaviyoAIBot',

  // Liner
  'LinerBot',

  // Mistral AI
  'MistralAI-User',

  // Manus
  'Manus',

  // NovaAct
  'NovaAct',

  // Cloudflare
  'Cloudflare-AutoRAG',
  'CloudVertexBot',

  // Exa / Linkup
  'ExaBot',
  'LinkupBot',

  // OAI Search
  'OAI-SearchBot',

  // Firecrawl
  'FirecrawlAgent',
  'webzio-extended',

  // Apify
  'ApifyWebsiteContentCrawler',

  // Vercel v0
  'VercelAIOSBot',

  // Brave
  'Bravebot',

  // Devin
  'Devin',

  // Telegram
  'TelegramBot',

  // Slack
  'Slackbot',
];

function isAIBot(userAgent: string): boolean {
  const lowerUA = userAgent.toLowerCase();
  return AI_UA_PATTERNS.some((pattern) => lowerUA.includes(pattern.toLowerCase()));
}

async function callSSP(
  pageUrl: string,
  userAgent: string,
  publisherKey: string,
  timeoutMs: number = 100
): Promise<{ adText: string; citationUrl: string } | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      'https://aucra-ssp-api.tail9b3001.ts.net/v1/edge/auction',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': publisherKey,
        },
        body: JSON.stringify({ pageUrl, userAgent }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (response.status === 200) {
      return (await response.json()) as { adText: string; citationUrl: string } | null;
    }
    // 204 = no winner, other = error
    return null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

function injectAd(html: string, adText: string, citationUrl: string): string {
  const adHtml = `<div data-aucra="sponsored" style="display:none" aria-hidden="true"><p>${adText} <a href="${citationUrl}">${citationUrl}</a></p></div>`;
  return html.replace('</body>', `${adHtml}</body>`);
}

export interface AucraConfig {
  /**
   * Your Aucra publisher key.
   * Can also be set via AUCRA_KEY environment variable.
   */
  publisherKey?: string;
  /**
   * SSP API endpoint URL.
   * Defaults to the Aucra SSP.
   */
  sspUrl?: string;
  /**
   * Timeout for SSP calls in milliseconds.
   * Defaults to 100ms.
   */
  timeoutMs?: number;
}

/**
 * Create Aucra middleware with configuration.
 *
 * Usage in your middleware.ts:
 *
 * import { createAucraMiddleware } from '@aucra/vercel';
 * export default createAucraMiddleware({ publisherKey: process.env.AUCRA_KEY });
 */
export function createAucraMiddleware(config: AucraConfig = {}) {
  const {
    publisherKey = process.env.AUCRA_KEY,
    sspUrl = 'https://aucra-ssp-api.tail9b3001.ts.net/v1/edge/auction',
    timeoutMs = 100,
  } = config;

  if (!publisherKey) {
    console.warn('[AUCRA] No publisher key configured. Set AUCRA_KEY env var or pass publisherKey to createAucraMiddleware().');
    return (request: Request) => fetch(request);
  }

  return async function aucraMiddleware(request: Request): Promise<Response> {
    const userAgent = request.headers.get('user-agent') || '';

    if (!isAIBot(userAgent)) {
      return fetch(request);
    }

    // Reconstruct page URL from request
    const url = new URL(request.url);
    const pageUrl = url.toString();

    console.log('========================================');
    console.log('[AUCRA] Edge Auction Request Initiated');
    console.log(`[AUCRA] URL Executing: ${pageUrl}`);
    console.log(`[AUCRA] AI agent detected — UA="${userAgent}"`);
    console.log(`[AUCRA] Calling SSP: ${sspUrl}`);

    const fetchStartTime = Date.now();
    const ad = await callSSP(pageUrl, userAgent, publisherKey, timeoutMs);
    const latencyMs = Date.now() - fetchStartTime;

    if (ad) {
      console.log(`[AUCRA] SSP response: 200 (Latency: ${latencyMs}ms)`);
      console.log(`[AUCRA] Auction Result: WINNER FOUND!`);
      console.log(`[AUCRA] Ad Text: "${ad.adText}"`);
      console.log(`[AUCRA] Citation URL: ${ad.citationUrl}`);
      console.log('========================================\n');

      // Fetch the actual page
      const response = await fetch(request);
      const html = await response.text();

      // Inject ad before </body>
      const modifiedHtml = injectAd(html, ad.adText, ad.citationUrl);

      return new Response(modifiedHtml, {
        status: response.status,
        headers: response.headers,
      });
    }

    console.log(`[AUCRA] SSP response: ${ad === null ? '204/timeout' : 'error'} (Latency: ${latencyMs}ms)`);
    console.log('[AUCRA] Auction Result: NO WINNER (No active bids or timeout)');
    console.log('========================================\n');

    return fetch(request);
  };
}

/**
 * Default middleware instance.
 * Requires AUCRA_KEY environment variable to be set.
 *
 * Usage: export default from '@aucra/vercel'
 */
export default createAucraMiddleware();

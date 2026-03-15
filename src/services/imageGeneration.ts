/**
 * AI Image Generation service.
 * Supports multiple engines: OpenAI Images, Stable Diffusion, Replicate.
 */

export type ImageEngine = 'openai' | 'stable-diffusion' | 'replicate';

export const VALID_IMAGE_CATEGORIES = [
  'nft-artwork',
  'profile-avatar',
  'banner',
  'token-logo',
  'collection-artwork',
] as const;

export type ImageCategory = (typeof VALID_IMAGE_CATEGORIES)[number];

/**
 * DALL-E 3 only supports specific square/rectangular sizes.
 * Map requested dimensions to the nearest supported size.
 */
type OpenAiSize = '1024x1024' | '1792x1024' | '1024x1792';

const OPENAI_SUPPORTED_SIZES: OpenAiSize[] = ['1024x1024', '1792x1024', '1024x1792'];

function resolveOpenAiSize(width: number, height: number): OpenAiSize {
  const ratio = width / height;
  if (ratio > 1.2) return '1792x1024';  // landscape
  if (ratio < 0.8) return '1024x1792';  // portrait
  return '1024x1024';                    // square (default)
}

export interface GenerateImageParams {
  prompt: string;
  engine: ImageEngine;
  category: ImageCategory;
  width?: number;
  height?: number;
  style?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  engine: ImageEngine;
  category: ImageCategory;
  prompt: string;
  width: number;
  height: number;
  createdAt: number;
}

/** Build a category-aware prompt prefix for better image quality. */
export function buildEnhancedPrompt(params: GenerateImageParams): string {
  const prefixes: Record<ImageCategory, string> = {
    'nft-artwork': 'High-quality NFT digital artwork, vibrant colors, unique generative art:',
    'profile-avatar': 'Professional Web3 profile avatar, clean design, circular crop friendly:',
    'banner': 'Wide-format crypto project banner, modern design, 3:1 aspect ratio:',
    'token-logo': 'Minimal token logo, icon style, bold colors, transparent background:',
    'collection-artwork': 'NFT collection key art, cohesive aesthetic, collection cover:',
  };
  const prefix = prefixes[params.category] ?? '';
  const style = params.style ? ` Style: ${params.style}.` : '';
  return `${prefix} ${params.prompt}${style}`.trim();
}

/**
 * Generate an image using the specified engine.
 * Real API keys are read from environment variables:
 *   OPENAI_API_KEY, REPLICATE_API_TOKEN, SD_API_URL
 */
export async function generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const enhancedPrompt = buildEnhancedPrompt(params);
  const w = params.width ?? 1024;
  const h = params.height ?? 1024;

  switch (params.engine) {
    case 'openai':
      return generateOpenAi(params, enhancedPrompt, w, h);
    case 'replicate':
      return generateReplicate(params, enhancedPrompt, w, h);
    case 'stable-diffusion':
    default:
      return generateStableDiffusion(params, enhancedPrompt, w, h);
  }
}

async function generateOpenAi(
  params: GenerateImageParams,
  prompt: string,
  width: number,
  height: number,
): Promise<GeneratedImage> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  // Resolve to a supported DALL-E 3 size (never blindly cast arbitrary dimensions)
  const size = resolveOpenAiSize(width, height);
  // Validate the resolved size is actually in the supported list (compile + runtime guard)
  if (!OPENAI_SUPPORTED_SIZES.includes(size)) {
    throw new Error(`Unsupported image size for OpenAI: ${size}`);
  }

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, n: 1, size, model: 'dall-e-3' }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);

  const data = (await res.json()) as { data: Array<{ url: string }> };
  const [outW, outH] = size.split('x').map(Number);
  return {
    id: `img_openai_${Date.now()}`,
    url: data.data[0].url,
    engine: 'openai',
    category: params.category,
    prompt,
    width: outW,
    height: outH,
    createdAt: Date.now(),
  };
}

/** Replicate poll timeout (ms) */
const REPLICATE_POLL_TIMEOUT = 120_000;
const REPLICATE_POLL_INTERVAL = 2_000;

/**
 * Replicate predictions are asynchronous. This helper polls the prediction
 * URL until the job succeeds or fails (or times out).
 */
async function pollReplicatePrediction(
  predictionUrl: string,
  token: string,
): Promise<string> {
  const deadline = Date.now() + REPLICATE_POLL_TIMEOUT;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, REPLICATE_POLL_INTERVAL));
    const res = await fetch(predictionUrl, {
      headers: { 'Authorization': `Token ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Replicate poll error: ${res.status}`);
    const pred = (await res.json()) as {
      status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
      output?: string[];
      error?: string;
    };
    if (pred.status === 'succeeded') {
      const url = pred.output?.[0];
      if (!url) throw new Error('Replicate returned no output URL');
      return url;
    }
    if (pred.status === 'failed' || pred.status === 'canceled') {
      throw new Error(`Replicate prediction ${pred.status}: ${pred.error ?? 'unknown'}`);
    }
    // status is 'starting' or 'processing' – keep polling
  }
  throw new Error('Replicate prediction timed out');
}

async function generateReplicate(
  params: GenerateImageParams,
  prompt: string,
  width: number,
  height: number,
): Promise<GeneratedImage> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('REPLICATE_API_TOKEN is not set');

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
      input: { prompt, width, height },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Replicate API error: ${res.status}`);

  const prediction = (await res.json()) as { id: string; urls?: { get?: string } };
  const pollUrl = prediction.urls?.get ?? `https://api.replicate.com/v1/predictions/${prediction.id}`;

  // Poll until the async job completes
  const imageUrl = await pollReplicatePrediction(pollUrl, token);

  return {
    id: `img_replicate_${prediction.id}`,
    url: imageUrl,
    engine: 'replicate',
    category: params.category,
    prompt,
    width,
    height,
    createdAt: Date.now(),
  };
}

async function generateStableDiffusion(
  params: GenerateImageParams,
  prompt: string,
  width: number,
  height: number,
): Promise<GeneratedImage> {
  const sdUrl = process.env.SD_API_URL ?? 'http://localhost:7860';
  const res = await fetch(`${sdUrl}/sdapi/v1/txt2img`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, width, height, steps: 20 }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Stable Diffusion API error: ${res.status}`);

  const data = (await res.json()) as { images?: string[] };
  const b64 = data.images?.[0];
  if (!b64) {
    throw new Error('Stable Diffusion returned no image data');
  }
  return {
    id: `img_sd_${Date.now()}`,
    url: `data:image/png;base64,${b64}`,
    engine: 'stable-diffusion',
    category: params.category,
    prompt,
    width,
    height,
    createdAt: Date.now(),
  };
}


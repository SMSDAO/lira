/**
 * AI Image Generation service.
 * Supports multiple engines: OpenAI Images, Stable Diffusion, Replicate.
 */

export type ImageEngine = 'openai' | 'stable-diffusion' | 'replicate';

export type ImageCategory =
  | 'nft-artwork'
  | 'profile-avatar'
  | 'banner'
  | 'token-logo'
  | 'collection-artwork';

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

  const size = `${width}x${height}` as '1024x1024' | '512x512' | '256x256';
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, n: 1, size, model: 'dall-e-3' }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);

  const data = (await res.json()) as { data: Array<{ url: string }> };
  return {
    id: `img_openai_${Date.now()}`,
    url: data.data[0].url,
    engine: 'openai',
    category: params.category,
    prompt,
    width,
    height,
    createdAt: Date.now(),
  };
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
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Replicate API error: ${res.status}`);

  const prediction = (await res.json()) as { id: string; output?: string[] };
  return {
    id: `img_replicate_${prediction.id}`,
    url: prediction.output?.[0] ?? '',
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
  const b64 = data.images?.[0] ?? '';
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

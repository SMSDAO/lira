import type { NextApiRequest, NextApiResponse } from 'next';
import { generateImage, VALID_IMAGE_CATEGORIES } from '@/services/imageGeneration';
import type { ImageEngine, ImageCategory } from '@/services/imageGeneration';
import { strictLimiter } from '@/security/rateLimit';
import { validateBody } from '@/security/requestValidation';

const schema = {
  prompt: { type: 'string' as const, required: true, minLength: 3, maxLength: 500 },
  engine: { type: 'string' as const, required: true },
  category: { type: 'string' as const, required: true },
};

const VALID_ENGINES: ImageEngine[] = ['openai', 'stable-diffusion', 'replicate'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!strictLimiter(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!validateBody(schema)(req, res)) return;

  const { prompt, engine, category, width, height, style } = req.body as {
    prompt: string;
    engine: string;
    category: string;
    width?: number;
    height?: number;
    style?: string;
  };

  if (!VALID_ENGINES.includes(engine as ImageEngine)) {
    return res.status(400).json({ error: `Invalid engine. Must be one of: ${VALID_ENGINES.join(', ')}` });
  }

  if (!(VALID_IMAGE_CATEGORIES as readonly string[]).includes(category)) {
    return res.status(400).json({
      error: `Invalid category. Must be one of: ${VALID_IMAGE_CATEGORIES.join(', ')}`,
    });
  }

  if (width !== undefined && (typeof width !== 'number' || width < 64 || width > 2048)) {
    return res.status(400).json({ error: 'width must be a number between 64 and 2048' });
  }
  if (height !== undefined && (typeof height !== 'number' || height < 64 || height > 2048)) {
    return res.status(400).json({ error: 'height must be a number between 64 and 2048' });
  }

  try {
    const image = await generateImage({
      prompt,
      engine: engine as ImageEngine,
      category: category as ImageCategory,
      width,
      height,
      style,
    });
    return res.status(200).json({ image });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    return res.status(500).json({ error: message });
  }
}

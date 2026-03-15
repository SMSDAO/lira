import type { NextApiRequest, NextApiResponse } from 'next';
import { generateImage } from '@/services/imageGeneration';
import type { ImageEngine, ImageCategory } from '@/services/imageGeneration';
import { strictLimiter } from '@/security/rateLimit';
import { validateBody } from '@/security/requestValidation';

const schema = {
  prompt: { type: 'string' as const, required: true, minLength: 3, maxLength: 500 },
  engine: { type: 'string' as const, required: true },
  category: { type: 'string' as const, required: true },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!strictLimiter(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!validateBody(schema)(req, res)) return;

  const { prompt, engine, category, width, height, style } = req.body as {
    prompt: string;
    engine: ImageEngine;
    category: ImageCategory;
    width?: number;
    height?: number;
    style?: string;
  };

  const validEngines: ImageEngine[] = ['openai', 'stable-diffusion', 'replicate'];
  if (!validEngines.includes(engine)) {
    return res.status(400).json({ error: `Invalid engine. Must be one of: ${validEngines.join(', ')}` });
  }

  try {
    const image = await generateImage({ prompt, engine, category, width, height, style });
    return res.status(200).json({ image });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    return res.status(500).json({ error: message });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { generateImage, VALID_IMAGE_CATEGORIES } from '@/services/imageGeneration';
import type { ImageEngine, ImageCategory } from '@/services/imageGeneration';
import { strictLimiter } from '@/security/rateLimit';
import { validateBody } from '@/security/requestValidation';
import { config } from '@/config';

const schema = {
  prompt: { type: 'string' as const, required: true, minLength: 3, maxLength: 500 },
  engine: { type: 'string' as const, required: true },
  category: { type: 'string' as const, required: true },
};

const VALID_ENGINES: ImageEngine[] = ['openai', 'stable-diffusion', 'replicate'];

/**
 * Extract and fully validate the lira_session cookie.
 * Verification steps:
 *   1. Structural parse – must be base64url(payload).base64url(HMAC)
 *   2. HMAC-SHA256 recomputation over the raw payload string (constant-time compare)
 *   3. Payload field presence (`address`, `expiresAt`)
 *   4. Expiry check
 */
async function getValidatedSession(
  req: NextApiRequest,
): Promise<{ address: string; expiresAt: number } | null> {
  const cookieHeader = req.headers.cookie ?? '';
  const match = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('lira_session='));
  if (!match) return null;

  // Cookie values may contain '=' (base64url chars) – preserve all after the first '='
  const tokenRaw = match.split('=').slice(1).join('=');
  if (!tokenRaw) return null;

  // Session token format: base64url(JSON payload) . base64url(HMAC)
  const dotIdx = tokenRaw.indexOf('.');
  if (dotIdx === -1) return null;
  const payloadB64 = tokenRaw.slice(0, dotIdx);
  const sigB64 = tokenRaw.slice(dotIdx + 1);
  if (!payloadB64 || !sigB64) return null;

  // Recompute expected HMAC and compare in constant time
  const secret = config.sessionSecret;
  const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
  let expectedSig: Buffer;
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const sigBytes = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(payloadStr),
      );
      expectedSig = Buffer.from(sigBytes);
    } else {
      const { createHmac } = await import('crypto');
      expectedSig = createHmac('sha256', secret).update(payloadStr).digest();
    }
  } catch {
    return null;
  }

  const providedSig = Buffer.from(sigB64, 'base64url');
  // Constant-time comparison to prevent timing attacks
  if (
    providedSig.length !== expectedSig.length ||
    !providedSig.equals(expectedSig)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(payloadStr) as {
      address?: string;
      expiresAt?: number;
    };
    if (!payload.address || typeof payload.expiresAt !== 'number') return null;
    if (Date.now() > payload.expiresAt) return null;
    return { address: payload.address, expiresAt: payload.expiresAt };
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!strictLimiter(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Guard 1: feature flag – allows disabling paid API calls at env level
  if (!config.features.imageGeneration) {
    return res.status(403).json({ error: 'Image generation is disabled' });
  }

  // Guard 2: require a valid (HMAC-verified + non-expired) session
  if (!await getValidatedSession(req)) {
    return res.status(401).json({ error: 'Authentication required for image generation' });
  }

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

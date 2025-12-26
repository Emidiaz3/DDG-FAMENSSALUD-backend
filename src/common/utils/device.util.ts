// src/common/utils/device.util.ts
import type { Request } from 'express';

export function isMobileRequest(req: Request): boolean {
  // Client Hints (Chrome/Android, etc.)
  const chMobile = req.headers['sec-ch-ua-mobile'];
  if (typeof chMobile === 'string' && chMobile.includes('?1')) return true;

  // User-Agent fallback (spoofable, pero suficiente para la lógica solicitada)
  const ua = (req.headers['user-agent'] ?? '').toLowerCase();
  return /android|iphone|ipad|ipod|iemobile|windows phone|mobile|opera mini|blackberry|webos/.test(
    ua,
  );
}

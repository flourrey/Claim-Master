import type { Request, Response } from 'express';

/**
 * Health check serverless endpoint
 * GET /api/health
 */
export default async function handler(req: Request | any, res: Response | any) {
  // Support CORS
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  const healthData = {
    status: 'ok',
    service: 'Claim Smarter Serverless API',
    endpoints: {
      health: '/api/health',
      conversion: '/api/conversion',
      ocr: '/api/OCR',
    },
    anthropicKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  if (res.status && typeof res.json === 'function') {
    return res.status(200).json(healthData);
  }

  return new Response(JSON.stringify(healthData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

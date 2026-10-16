import type { Request, Response } from 'express';

// Supported Anthropic multimodal image types
const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type AllowedMediaType = typeof ALLOWED_MEDIA_TYPES[number];

/**
 * Serverless Receipt OCR endpoint using Claude Vision
 * 
 * Endpoint: POST /api/OCR (or /api/ocr)
 * Accepts: { image: string (base64 or data URL), mediaType?: string, model?: string }
 */
export default async function handler(req: Request | any, res: Response | any) {
  // CORS configuration
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'Claim Smarter Receipt OCR',
      model: 'claude-haiku-5-5',
      acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      note: 'HEIC photos from iPhones need converting to JPEG before sending.',
      apiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // 1. Resolve Anthropic API key (environment or request header, without hardcoding)
  const apiKey =
    (req.headers?.['x-api-key'] as string) ||
    (req.headers?.['authorization'] as string)?.replace(/^Bearer\s+/i, '') ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.CLAUDE_API_KEY ||
    '';

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'ANTHROPIC_API_KEY is not set. Please provide the key in environment variables or the x-api-key header.',
      requiresKey: true,
    });
  }

  try {
    const body = req.body || {};
    const rawImageInput = body.image || body.imageBase64 || body.data;

    if (!rawImageInput || typeof rawImageInput !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing receipt image in request body. Provide "image" as a base64 string or data URL.',
      });
    }

    // 2. Parse image data and media type
    let base64Data = rawImageInput;
    let detectedMediaType: string = body.mediaType || body.mimeType || 'image/jpeg';

    if (rawImageInput.startsWith('data:')) {
      const match = rawImageInput.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        detectedMediaType = match[1].toLowerCase();
        base64Data = match[2];
      }
    }

    // Normalize media type for Claude Vision (JPEG, PNG, GIF, WebP)
    let finalMediaType: AllowedMediaType = 'image/jpeg';
    if (detectedMediaType === 'image/png') {
      finalMediaType = 'image/png';
    } else if (detectedMediaType === 'image/gif') {
      finalMediaType = 'image/gif';
    } else if (detectedMediaType === 'image/webp') {
      finalMediaType = 'image/webp';
    } else {
      // JPEG or converted HEIC/other formats
      finalMediaType = 'image/jpeg';
    }

    // 3. Prepare payload for Anthropic Messages API
    const model = body.model || 'claude-haiku-5-5';
    const systemPrompt =
      'You read expense receipts for a claims app. Return ONLY valid JSON, no other text. Never guess: if a field is unclear or missing, use null. currency must be a 3-letter ISO code (e.g. SGD, JPY, THB). date must be YYYY-MM-DD. total is the final amount paid, as a number without symbols. confidence is high, medium or low.';

    const anthropicPayload = {
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: finalMediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Read this receipt and return exactly this JSON shape: {"date":"YYYY-MM-DD","receipt_no":"string or null","merchant":"string or null","description":"short item summary or null","currency":"ISO code or null","total":0,"confidence":"high|medium|low"}',
            },
          ],
        },
      ],
    };

    // 4. Call Anthropic Messages endpoint
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(anthropicPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errJson: any;
      try {
        errJson = JSON.parse(errText);
      } catch {
        errJson = null;
      }

      console.error('Anthropic API Error:', response.status, errText);
      return res.status(response.status).json({
        success: false,
        error: errJson?.error?.message || `Anthropic API error (${response.status})`,
        details: errJson || errText,
      });
    }

    const data: any = await response.json();

    // 5. Extract text from Anthropic response content
    const textBlock = data?.content?.find((item: any) => item.type === 'text')?.text || '';

    // Strip any markdown code fences if model enclosed JSON in ```json ... ```
    const cleanedJsonText = textBlock
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let parsedResult = null;
    try {
      parsedResult = JSON.parse(cleanedJsonText);
    } catch (parseErr) {
      console.warn('Failed to parse Claude output directly:', cleanedJsonText);
      // Attempt regex extraction of first {...}
      const match = cleanedJsonText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedResult = JSON.parse(match[0]);
      } else {
        throw new Error('Claude returned non-JSON text: ' + cleanedJsonText);
      }
    }

    return res.status(200).json({
      success: true,
      data: parsedResult,
      model: data.model || model,
      usage: data.usage,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in OCR serverless handler:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to parse receipt with OCR',
    });
  }
}

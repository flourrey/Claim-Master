import type { Request, Response } from 'express';

// Environment variable for optional API key (not hardcoded)
const API_KEY = process.env.FRANKFURTER_API_KEY || process.env.CURRENCY_API_KEY || '';

interface RateItem {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

interface InvoiceItem {
  id?: string | number;
  amount: number | string;
  currency: string;
  date?: string;
  description?: string;
  [key: string]: any;
}

/**
 * Fetch rates from Frankfurter v2 rates endpoint
 * GET https://api.frankfurter.dev/v2/rates?base=SGD&quotes=USD,EUR,MYR,IDR,VND
 */
async function fetchFrankfurterRates(base = 'SGD', quotes = 'USD,EUR,MYR,IDR,VND'): Promise<RateItem[]> {
  const url = `https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(base)}&quotes=${encodeURIComponent(quotes)}`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  // Inject API key if configured in environment, without hardcoding
  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Frankfurter v2 API error: HTTP ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (Array.isArray(data)) {
    return data;
  }
  
  // If wrapped in an object
  if (data && typeof data === 'object' && Array.isArray(data.rates)) {
    return data.rates;
  }

  throw new Error('Unexpected response format from Frankfurter rates endpoint');
}

/**
 * Serverless Currency Conversion Handler
 * Endpoints:
 * - GET  /api/conversion?base=SGD&quotes=USD,EUR,MYR,IDR,VND
 * - GET  /api/conversion?from=USD&to=SGD&amount=100
 * - POST /api/conversion (body: { items: [...], targetCurrency?: 'SGD' } or { from, to, amount })
 */
export default async function handler(req: Request | any, res: Response | any) {
  // CORS support for serverless invocation
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  try {
    // 1. Fetch live rates from Frankfurter v2 endpoint
    // Default base is SGD, quotes USD,EUR,MYR,IDR,VND as requested
    const requestedBase = (req.query?.base as string) || 'SGD';
    const requestedQuotes = (req.query?.quotes as string) || 'USD,EUR,MYR,IDR,VND';

    let rawRates: RateItem[] = [];
    try {
      rawRates = await fetchFrankfurterRates(requestedBase, requestedQuotes);
    } catch (ratesErr: any) {
      console.warn('Failed to fetch from Frankfurter v2, attempting fallback:', ratesErr?.message);
      // Fallback to Frankfurter latest API if v2 is temporarily unavailable
      const fallbackUrl = `https://api.frankfurter.app/latest?from=${encodeURIComponent(requestedBase)}`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) {
        const fallbackData: any = await fallbackRes.json();
        const fallbackDate = fallbackData.date || new Date().toISOString().split('T')[0];
        rawRates = Object.entries(fallbackData.rates || {}).map(([quote, rate]) => ({
          date: fallbackDate,
          base: requestedBase,
          quote,
          rate: rate as number,
        }));
      } else {
        throw ratesErr;
      }
    }

    // Map: quoteCurrency -> rate (where 1 base = rate * quote)
    // For base=SGD, rate is how many quote units per 1 SGD
    // To convert 1 unit of quote to SGD: multiplier = 1 / rate
    const ratesMap: Record<string, { rate: number; multiplierToSgd: number; date: string }> = {
      SGD: { rate: 1.0, multiplierToSgd: 1.0, date: new Date().toISOString().split('T')[0] },
    };

    rawRates.forEach((item) => {
      const quoteUpper = item.quote.toUpperCase();
      const numRate = Number(item.rate);
      if (numRate > 0) {
        ratesMap[quoteUpper] = {
          rate: numRate,
          // If base is SGD, 1 SGD = numRate quoteCurrency -> 1 quoteCurrency = (1 / numRate) SGD
          multiplierToSgd: Number((1 / numRate).toFixed(6)),
          date: item.date,
        };
      }
    });

    // Case A: POST request with invoice items or single conversion
    if (req.method === 'POST') {
      const body = req.body || {};
      const targetCurrency = (body.targetCurrency || 'SGD').toUpperCase();

      // If converting an array of invoice items
      if (Array.isArray(body.items)) {
        const convertedItems = body.items.map((item: InvoiceItem, index: number) => {
          const originalAmount = parseFloat(String(item.amount || 0));
          const curr = (item.currency || 'SGD').toUpperCase();

          let rateUsed = 1.0;
          let convertedAmount = originalAmount;

          if (curr === targetCurrency) {
            rateUsed = 1.0;
            convertedAmount = originalAmount;
          } else if (ratesMap[curr]) {
            rateUsed = ratesMap[curr].multiplierToSgd;
            convertedAmount = Number((originalAmount * rateUsed).toFixed(2));
          } else {
            // Unmapped currency
            rateUsed = 0;
            convertedAmount = 0;
          }

          return {
            ...item,
            originalAmount: isNaN(originalAmount) ? 0 : originalAmount,
            originalCurrency: curr,
            rateUsed,
            targetCurrency,
            convertedAmount: isNaN(convertedAmount) ? 0 : convertedAmount,
          };
        });

        const totalConverted = convertedItems.reduce((acc: number, curr: { convertedAmount: number }) => acc + curr.convertedAmount, 0);

        return res.status(200).json({
          success: true,
          base: requestedBase,
          targetCurrency,
          totalConverted: Number(totalConverted.toFixed(2)),
          itemCount: convertedItems.length,
          items: convertedItems,
          ratesUsed: ratesMap,
          source: 'https://api.frankfurter.dev/v2/rates',
          timestamp: new Date().toISOString(),
        });
      }

      // Single item conversion via POST
      const fromCurr = (body.from || body.currency || 'USD').toUpperCase();
      const toCurr = (body.to || targetCurrency || 'SGD').toUpperCase();
      const amount = parseFloat(String(body.amount || 0));

      let rate = 1.0;
      let convertedAmount = amount;

      if (fromCurr === toCurr) {
        rate = 1.0;
        convertedAmount = amount;
      } else if (ratesMap[fromCurr]) {
        rate = ratesMap[fromCurr].multiplierToSgd;
        convertedAmount = Number((amount * rate).toFixed(2));
      }

      return res.status(200).json({
        success: true,
        from: fromCurr,
        to: toCurr,
        originalAmount: amount,
        rate,
        convertedAmount,
        ratesMap,
        source: 'https://api.frankfurter.dev/v2/rates',
        timestamp: new Date().toISOString(),
      });
    }

    // Case B: GET request with conversion query parameters
    const queryFrom = (req.query?.from as string)?.toUpperCase();
    const queryAmount = parseFloat((req.query?.amount as string) || '0');

    if (queryFrom) {
      const toCurr = ((req.query?.to as string) || 'SGD').toUpperCase();
      let rate = 1.0;
      let convertedAmount = queryAmount;

      if (queryFrom === toCurr) {
        rate = 1.0;
        convertedAmount = queryAmount;
      } else if (ratesMap[queryFrom]) {
        rate = ratesMap[queryFrom].multiplierToSgd;
        convertedAmount = Number((queryAmount * rate).toFixed(2));
      }

      return res.status(200).json({
        success: true,
        from: queryFrom,
        to: toCurr,
        originalAmount: queryAmount,
        rate,
        convertedAmount,
        ratesMap,
        source: 'https://api.frankfurter.dev/v2/rates',
        timestamp: new Date().toISOString(),
      });
    }

    // Case C: Standard GET request returning rates
    return res.status(200).json({
      success: true,
      base: requestedBase,
      quotes: requestedQuotes.split(','),
      rawRates,
      ratesToSgd: ratesMap,
      source: 'https://api.frankfurter.dev/v2/rates?base=SGD&quotes=USD,EUR,MYR,IDR,VND',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in conversion serverless handler:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to convert currency rates',
      source: 'https://api.frankfurter.dev/v2/rates',
    });
  }
}

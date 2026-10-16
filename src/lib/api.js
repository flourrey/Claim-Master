/**
 * Claim Smarter - API & Network Layer (Front End Only)
 * 
 * Handles:
 * - Live exchange rate lookups via Frankfurter public API
 * - Front-end receipt processing simulation (preparing for Step 2 Gemini backend)
 * - Safe error handling and offline fallbacks
 */

// Common currency fallbacks (SGD equivalent per 1 unit of foreign currency)
const FALLBACK_RATES_TO_SGD = {
  SGD: 1.0,
  USD: 1.35,
  EUR: 1.46,
  GBP: 1.72,
  JPY: 0.0089,
  MYR: 0.31,
  AUD: 0.88,
  HKD: 0.17,
  CNY: 0.19,
  THB: 0.039,
  IDR: 0.000085,
  KRW: 0.0010,
  NZD: 0.81,
  CHF: 1.54,
  CAD: 0.98,
};

/**
 * Fetch real-time or historical exchange rate from Frankfurter API
 * Converts 1 unit of `fromCurrency` to SGD
 *
 * @param {string} fromCurrency - e.g. "USD", "EUR", "JPY"
 * @param {string} [date] - Optional date in YYYY-MM-DD format
 * @returns {Promise<{ rate: number, source: string, date: string }>}
 */
export async function fetchExchangeRate(fromCurrency, date = null) {
  const currency = (fromCurrency || '').toUpperCase().trim();

  // If already SGD, rate is always 1
  if (currency === 'SGD') {
    return {
      rate: 1.0,
      source: 'identity',
      date: date || new Date().toISOString().split('T')[0],
    };
  }

  // Frankfurter supports major currencies: USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, HKD, NZD, etc.
  const endpointBase = 'https://api.frankfurter.app';
  const datePath = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : 'latest';
  const url = `${endpointBase}/${datePath}?from=${encodeURIComponent(currency)}&to=SGD`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Frankfurter HTTP ${res.status}`);
    }

    const data = await res.json();
    const rate = data?.rates?.SGD;

    if (typeof rate === 'number' && rate > 0) {
      return {
        rate: Number(rate.toFixed(4)),
        source: 'Frankfurter',
        date: data.date || datePath,
      };
    }
    throw new Error('Rate for SGD not present in response');
  } catch (err) {
    console.warn(`[Frankfurter API] Falling back for ${currency}:`, err?.message || err);

    // Check if we have an estimated fallback rate
    if (FALLBACK_RATES_TO_SGD[currency]) {
      return {
        rate: FALLBACK_RATES_TO_SGD[currency],
        source: 'Estimated Fallback',
        date: date || new Date().toISOString().split('T')[0],
      };
    }

    // Return null so user can manually type rate in Review Screen
    return {
      rate: null,
      source: 'Manual Required',
      date: date || new Date().toISOString().split('T')[0],
    };
  }
}

/**
 * Supported currencies for selection
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'SGD', label: 'SGD - Singapore Dollar' },
  { code: 'USD', label: 'USD - US Dollar' },
  { code: 'EUR', label: 'EUR - Euro' },
  { code: 'GBP', label: 'GBP - British Pound' },
  { code: 'JPY', label: 'JPY - Japanese Yen' },
  { code: 'MYR', label: 'MYR - Malaysian Ringgit' },
  { code: 'AUD', label: 'AUD - Australian Dollar' },
  { code: 'HKD', label: 'HKD - Hong Kong Dollar' },
  { code: 'CNY', label: 'CNY - Chinese Yuan' },
  { code: 'THB', label: 'THB - Thai Baht' },
  { code: 'IDR', label: 'IDR - Indonesian Rupiah' },
  { code: 'KRW', label: 'KRW - South Korean Won' },
  { code: 'CAD', label: 'CAD - Canadian Dollar' },
];

/**
 * Front-end simulation of receipt image reading.
 * In Step 2, this will be connected to the Gemini multimodal API endpoint.
 * 
 * @param {File} file
 * @returns {Promise<object>} Extracted receipt draft data
 */
export async function parseReceiptImage(file) {
  // Read file into Data URL for preview thumbnail and PDF inclusion
  const dataUrl = await readFileAsDataURL(file);

  // Simulate network latency / reading process
  await new Promise((resolve) => setTimeout(resolve, 1400 + Math.random() * 800));

  // If corrupted or non-receipt mock test
  if (file.name.toLowerCase().includes('corrupt') || file.name.toLowerCase().includes('fail')) {
    return {
      id: generateId(),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      dataUrl,
      status: 'failed', // Reading / Ready / Needs a look / Failed
      error: 'Receipt image unreadable or blur. Please retake photo.',
      date: '',
      receiptNo: '',
      expenseItem: '',
      currency: 'SGD',
      amount: '',
      rate: 1.0,
      amountSgd: '',
      confidence: 0,
    };
  }

  // Derive realistic dummy extracted details based on filename or randomly
  const nameLower = file.name.toLowerCase();
  let extracted = {
    date: new Date().toISOString().split('T')[0],
    receiptNo: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
    expenseItem: 'Business Meal & Hospitality',
    currency: 'SGD',
    amount: (24.50 + Math.floor(Math.random() * 80)).toFixed(2),
    confidence: 0.94,
    status: 'ready',
  };

  if (nameLower.includes('grab') || nameLower.includes('taxi') || nameLower.includes('transport')) {
    extracted.expenseItem = 'Grab Transport / Taxi';
    extracted.amount = (18.60 + Math.floor(Math.random() * 15)).toFixed(2);
    extracted.currency = 'SGD';
  } else if (nameLower.includes('hotel') || nameLower.includes('stay')) {
    extracted.expenseItem = 'Hotel Accommodation';
    extracted.amount = (180.00 + Math.floor(Math.random() * 150)).toFixed(2);
    extracted.currency = 'USD';
  } else if (nameLower.includes('flight') || nameLower.includes('airline')) {
    extracted.expenseItem = 'Airfare & Travel Booking';
    extracted.amount = (450.00 + Math.floor(Math.random() * 300)).toFixed(2);
    extracted.currency = 'USD';
  } else if (nameLower.includes('lunch') || nameLower.includes('dinner') || nameLower.includes('food') || nameLower.includes('cafe')) {
    extracted.expenseItem = 'Client Dinner & Entertainment';
    extracted.amount = (65.20 + Math.floor(Math.random() * 45)).toFixed(2);
    extracted.currency = 'SGD';
  } else if (nameLower.includes('tokyo') || nameLower.includes('japan')) {
    extracted.expenseItem = 'Shinkansen & Station Travel';
    extracted.amount = '4500';
    extracted.currency = 'JPY';
  } else if (nameLower.includes('blur') || nameLower.includes('uncertain') || nameLower.includes('partial')) {
    // Deliberately create a "Needs a look" scenario
    extracted.expenseItem = 'Office Supplies';
    extracted.amount = '';
    extracted.receiptNo = '';
    extracted.confidence = 0.52;
    extracted.status = 'needs_look';
  } else {
    // Standard random plausible scenario
    const items = [
      { item: 'Client Coffee & Meeting', currency: 'SGD', min: 12, max: 28 },
      { item: 'Software Subscription (Cloud Tools)', currency: 'USD', min: 20, max: 80 },
      { item: 'Team Project Lunch', currency: 'SGD', min: 45, max: 120 },
      { item: 'Airport Express Train', currency: 'HKD', min: 110, max: 180 },
      { item: 'Conference Registration Fee', currency: 'USD', min: 150, max: 350 },
    ];
    const picked = items[Math.floor(Math.random() * items.length)];
    extracted.expenseItem = picked.item;
    extracted.currency = picked.currency;
    extracted.amount = (picked.min + Math.random() * (picked.max - picked.min)).toFixed(2);
  }

  // Handle SGD vs Foreign currency exchange rate
  let rate = 1.0;
  let amountSgd = '';

  if (extracted.currency === 'SGD') {
    rate = 1.0;
    amountSgd = extracted.amount ? Number(extracted.amount).toFixed(2) : '';
  } else {
    const rateInfo = await fetchExchangeRate(extracted.currency, extracted.date);
    rate = rateInfo.rate;
    if (rate && extracted.amount) {
      amountSgd = (Number(extracted.amount) * rate).toFixed(2);
    }
  }

  // Determine status: "ready" vs "needs_look"
  const hasEmptyFields = !extracted.date || !extracted.receiptNo || !extracted.expenseItem || !extracted.amount || !amountSgd;
  const status = (hasEmptyFields || extracted.confidence < 0.8) ? 'needs_look' : 'ready';

  return {
    id: generateId(),
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    dataUrl,
    status, // 'reading' | 'ready' | 'needs_look' | 'failed'
    date: extracted.date,
    receiptNo: extracted.receiptNo,
    expenseItem: extracted.expenseItem,
    currency: extracted.currency,
    amount: extracted.amount,
    rate: rate !== null ? rate : '',
    amountSgd: amountSgd,
    confidence: extracted.confidence,
    error: null,
  };
}

/**
 * Utility to read browser File object as Data URL
 */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * Generate unique ID for receipts
 */
export function generateId() {
  return 'rcpt_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Built-in sample receipts for instant testing without needing real photos
 */
export function getSampleReceipts() {
  // Generate lightweight SVG data URLs as realistic sample receipt images
  const sample1Svg = createSampleReceiptSvg('TOKYO BISTRO & GRILL', 'INV-88910', '2026-10-12', 'JPY', '4,850', 'Business Dinner with Client');
  const sample2Svg = createSampleReceiptSvg('GRAB SINGAPORE', 'GRAB-2026-993', '2026-10-14', 'SGD', '28.40', 'Airport to Office Transport');
  const sample3Svg = createSampleReceiptSvg('AMAZON WEB SERVICES', 'AWS-991204', '2026-10-10', 'USD', '64.00', 'Cloud Server Hosting');

  return [
    {
      id: generateId(),
      fileName: 'grab_ride_changi.jpg',
      fileSize: 142000,
      fileType: 'image/jpeg',
      dataUrl: sample2Svg,
      status: 'ready',
      date: '2026-10-14',
      receiptNo: 'GRAB-2026-993',
      expenseItem: 'Grab Airport to Office Transport',
      currency: 'SGD',
      amount: '28.40',
      rate: 1.0,
      amountSgd: '28.40',
      confidence: 0.98,
      error: null,
    },
    {
      id: generateId(),
      fileName: 'tokyo_dinner_client.png',
      fileSize: 220000,
      fileType: 'image/png',
      dataUrl: sample1Svg,
      status: 'ready',
      date: '2026-10-12',
      receiptNo: 'INV-88910',
      expenseItem: 'Tokyo Bistro Business Dinner',
      currency: 'JPY',
      amount: '4850.00',
      rate: 0.0089,
      amountSgd: '43.17',
      confidence: 0.91,
      error: null,
    },
    {
      id: generateId(),
      fileName: 'aws_cloud_monthly.pdf',
      fileSize: 85000,
      fileType: 'application/pdf',
      dataUrl: sample3Svg,
      status: 'needs_look',
      date: '2026-10-10',
      receiptNo: 'AWS-991204',
      expenseItem: 'AWS Cloud Server Hosting',
      currency: 'USD',
      amount: '64.00',
      rate: 1.35,
      amountSgd: '86.40',
      confidence: 0.74,
      error: null,
    },
  ];
}

function createSampleReceiptSvg(merchant, inv, date, curr, amount, desc) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520">
    <rect width="400" height="520" fill="#fdfbf7"/>
    <path d="M0,0 L400,0 L400,505 Q350,515 300,505 Q250,515 200,505 Q150,515 100,505 Q50,515 0,505 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
    <line x1="20" y1="20" x2="380" y2="20" stroke="#cbd5e1" stroke-dasharray="4 4" stroke-width="2"/>
    <text x="200" y="65" font-family="monospace, sans-serif" font-weight="bold" font-size="20" text-anchor="middle" fill="#0f172a">${merchant}</text>
    <text x="200" y="90" font-family="monospace, sans-serif" font-size="12" text-anchor="middle" fill="#64748b">OFFICIAL TAX RECEIPT / INVOICE</text>
    <line x1="40" y1="110" x2="360" y2="110" stroke="#e2e8f0" stroke-width="1"/>
    
    <text x="40" y="140" font-family="monospace, sans-serif" font-size="12" fill="#475569">DATE:</text>
    <text x="360" y="140" font-family="monospace, sans-serif" font-size="12" text-anchor="end" fill="#0f172a" font-weight="bold">${date}</text>
    
    <text x="40" y="170" font-family="monospace, sans-serif" font-size="12" fill="#475569">RECEIPT #:</text>
    <text x="360" y="170" font-family="monospace, sans-serif" font-size="12" text-anchor="end" fill="#0f172a" font-weight="bold">${inv}</text>
    
    <line x1="40" y1="195" x2="360" y2="195" stroke="#e2e8f0" stroke-width="1"/>
    
    <text x="40" y="225" font-family="monospace, sans-serif" font-size="13" font-weight="bold" fill="#1e293b">DESCRIPTION</text>
    <text x="360" y="225" font-family="monospace, sans-serif" font-size="13" font-weight="bold" text-anchor="end" fill="#1e293b">TOTAL</text>
    
    <text x="40" y="260" font-family="monospace, sans-serif" font-size="12" fill="#334155">${desc}</text>
    <text x="360" y="260" font-family="monospace, sans-serif" font-size="13" text-anchor="end" fill="#0f172a">${curr} ${amount}</text>
    
    <line x1="40" y1="330" x2="360" y2="330" stroke="#cbd5e1" stroke-dasharray="2 2" stroke-width="1.5"/>
    
    <text x="40" y="370" font-family="monospace, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">TOTAL PAID</text>
    <text x="360" y="370" font-family="monospace, sans-serif" font-size="18" font-weight="bold" text-anchor="end" fill="#0284c7">${curr} ${amount}</text>
    
    <text x="200" y="440" font-family="monospace, sans-serif" font-size="11" text-anchor="middle" fill="#94a3b8">THANK YOU FOR YOUR BUSINESS</text>
    <rect x="150" y="460" width="100" height="20" fill="#e2e8f0" rx="3"/>
    <text x="200" y="474" font-family="monospace, sans-serif" font-size="10" text-anchor="middle" fill="#475569">PAID VIA CARD</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

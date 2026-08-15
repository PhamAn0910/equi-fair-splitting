import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

// --- Server-side env vars (never exposed to client) ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const jwtSecret = process.env.SUPABASE_JWT_SECRET!;

// --- Prompt (same as was in the client) ---
const PROMPT_TEXT = `You are an expert receipt/invoice parser. Your job is to extract data from this receipt image.

STEP 1: Identify the SUBTOTAL line (the sum of all items BEFORE tax/fees)
STEP 2: Identify Tax, Service Charge, Tip, and Discount lines SEPARATELY
STEP 3: Extract each purchasable item

CRITICAL RULES:
1. For item pricing: If there are "PRICE" and "SUBTOTAL/AMOUNT/TOTAL" columns, use the line-item SUBTOTAL (not unit price). Calculate unit_price = line_subtotal / quantity.
2. DO NOT include Tax, VAT, GST, Service Charge, Tip, or Discount as "items" - return them in "fees" instead.
3. DO NOT include the Grand Total or Subtotal summary row as an item.

WHAT TO RETURN:
- items: Array of purchasable items (name, price per unit, quantity)
- fees: Object with tax, tip, service_charge, discount amounts (use 0 if not present)
- subtotal: The bill subtotal BEFORE fees (sum of all item prices × quantities)

Example output structure:
{
  "items": [{"name": "Burger", "price": 12.50, "quantity": 1}],
  "fees": {"tax": 2.50, "tip": 0, "service_charge": 0, "discount": 0},
  "subtotal": 45.00
}

Respond ONLY with a valid JSON object matching this structure.`;

// --- Helpers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processAIResponse(parsed: any) {
  const items = (parsed.items || []).map((item: any) => ({
    name: item.name || 'Unknown Item',
    price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
    quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1,
  }));

  const fees = {
    tax: parsed.fees?.tax || 0,
    tip: parsed.fees?.tip || 0,
    service_charge: parsed.fees?.service_charge || 0,
    discount: parsed.fees?.discount || 0,
  };

  const subtotal =
    parsed.subtotal ||
    items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

  return { items, fees, subtotal };
}

async function callGemini(base64Data: string, mimeType: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  console.log('Attempting with Gemini 3.5 Flash...');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT_TEXT },
              { inline_data: { mime_type: mimeType, data: base64Data } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 429) throw new Error('Gemini Rate limit exceeded');
    throw new Error(errorData?.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) throw new Error('No content received from Gemini');

  try {
    return processAIResponse(JSON.parse(textContent));
  } catch {
    throw new Error('Failed to parse Gemini JSON response');
  }
}

async function callQwen(base64WithPrefix: string) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured on the server');
  }

  console.log('Attempting with Qwen 2.5 VL (OpenRouter)...');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.VITE_APP_URL || 'https://localhost',
      'X-Title': 'Bill Painter',
    },
    body: JSON.stringify({
      model: 'qwen/qwen2.5-vl-72b-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT_TEXT },
            { type: 'image_url', image_url: { url: base64WithPrefix } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 429) throw new Error('Qwen Rate limit exceeded');
    if (response.status === 402) throw new Error('Insufficient OpenRouter credits');
    throw new Error(errorData?.error?.message || `OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const messageContent = data.choices?.[0]?.message?.content;

  if (!messageContent) throw new Error('No content received from Qwen');

  try {
    const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in Qwen response');
    return processAIResponse(JSON.parse(jsonMatch[0]));
  } catch {
    throw new Error('Failed to parse Qwen JSON response');
  }
}

// --- Auth helper (same pattern as checkout/portal) ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function verifyAuthToken(token: string, supabaseClient: any) {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (!error && user) {
    return user;
  }

  // Manual JWT verification for Clerk IDs (non-UUID sub claims)
  if (error && jwtSecret) {
    try {
      const [header, payload, signature] = token.split('.');
      if (!header || !payload || !signature) throw new Error('Invalid token format');

      const signatureInput = `${header}.${payload}`;
      const hmac = createHmac('sha256', jwtSecret);
      const calculatedSignature = hmac.update(signatureInput).digest('base64url');

      if (signature !== calculatedSignature) {
        throw new Error('Invalid signature');
      }

      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));

      if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
        throw new Error('Token expired');
      }

      return {
        id: decodedPayload.sub,
        email: decodedPayload.email,
        app_metadata: decodedPayload.app_metadata || {},
        user_metadata: decodedPayload.user_metadata || {},
        aud: decodedPayload.aud,
        created_at: new Date().toISOString(),
      };
    } catch (manualVerifyError) {
      console.warn('Manual JWT verification failed:', manualVerifyError);
    }
  }

  return null;
}

// --- Handler ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- Auth ---
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const user = await verifyAuthToken(token, supabaseClient);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  // --- Parse body ---
  const { imageBase64, mimeType } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing imageBase64 in request body' });
  }

  const resolvedMimeType = mimeType || 'image/jpeg';

  // Strip the data URL prefix if present, but keep the full version for Qwen
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const base64WithPrefix = imageBase64.includes(',')
    ? imageBase64
    : `data:${resolvedMimeType};base64,${imageBase64}`;

  // --- Gemini → Qwen fallback (same logic as was in useReceiptOCR.ts) ---
  try {
    let result;
    let usedModel = 'gemini';

    try {
      result = await callGemini(base64Data, resolvedMimeType);
    } catch (geminiError) {
      console.warn('Gemini failed, falling back to Qwen:', geminiError);

      try {
        usedModel = 'qwen';
        result = await callQwen(base64WithPrefix);
      } catch (qwenError) {
        console.error('Qwen fallback also failed:', qwenError);
        return res.status(502).json({
          error:
            'Failed to parse receipt with both Gemini and Qwen models. Please try again later.',
        });
      }
    }

    return res.status(200).json({
      items: result.items,
      fees: result.fees,
      subtotal: result.subtotal,
      usedModel,
    });
  } catch (err) {
    console.error('scan-receipt error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}

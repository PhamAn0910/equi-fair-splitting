import { useState } from 'react';
import { toast } from 'sonner';
import type { ExpenseItem, ExpenseFees } from '@/stores/paintStore';

export interface ParsedReceiptData {
  items: ExpenseItem[];
  fees: ExpenseFees;
  subtotal: number;
  usedModel?: string;
}

interface UseReceiptOCRResult {
  parseReceipt: (file: File) => Promise<ParsedReceiptData>;
  isLoading: boolean;
  error: string | null;
}

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

// Helper to process the raw AI response into our internal format
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
    discount: parsed.fees?.discount || 0
  };

  const subtotal = parsed.subtotal || items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

  return { items, fees, subtotal };
}

async function callGemini(base64Data: string, mimeType: string) {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not configured');
  }

  console.log('Attempting with Gemini 2.5 Flash...');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPT_TEXT },
            { inline_data: { mime_type: mimeType, data: base64Data } }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        }
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
  } catch (e) {
    throw new Error('Failed to parse Gemini JSON response');
  }
}

async function callQwen(base64WithPrefix: string) {
  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    throw new Error('VITE_OPENROUTER_API_KEY is not configured');
  }

  console.log('Attempting with Qwen 2.5 VL (OpenRouter)...');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Bill Painter'
    },
    body: JSON.stringify({
      // Use paid version for better reliability as fallback
      model: 'qwen/qwen-2.5-vl-7b-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT_TEXT },
            { type: 'image_url', image_url: { url: base64WithPrefix } }
          ]
        }
      ]
    })
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
  } catch (e) {
    throw new Error('Failed to parse Qwen JSON response');
  }
}

export function useReceiptOCR(): UseReceiptOCRResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseReceipt = async (file: File): Promise<ParsedReceiptData> => {
    setIsLoading(true);
    setError(null);

    const emptyResult: ParsedReceiptData = {
      items: [],
      fees: { tax: 0, tip: 0, service_charge: 0, discount: 0 },
      subtotal: 0
    };

    try {
      // Prepare file data
      const base64WithPrefix = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = base64WithPrefix.includes(',') ? base64WithPrefix.split(',')[1] : base64WithPrefix;
      const mimeType = file.type || 'image/jpeg';

      let result;
      let usedModel = 'gemini';

      // Try Gemini first
      try {
        result = await callGemini(base64Data, mimeType);
      } catch (geminiError) {
        console.warn('Gemini failed, falling back to Qwen:', geminiError);

        // Try Qwen fallback
        try {
          usedModel = 'qwen';
          result = await callQwen(base64WithPrefix);
        } catch (qwenError) {
          console.error('Qwen fallback also failed:', qwenError);
          // If both fail, throw a combined error or the last error
          throw new Error('Failed to parse receipt with both Gemini and Qwen models. Please check your API keys or try again later.');
        }
      }

      // Add unique IDs to items
      const items: ExpenseItem[] = result.items.map((item: any, index: number) => ({
        id: `item-${Date.now()}-${index}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const finalResult = {
        items,
        fees: result.fees,
        subtotal: result.subtotal,
        usedModel
      };

      console.log('Parsed receipt data:', finalResult);

      if (items.length === 0) {
        toast.warning('No items found in receipt. Try a clearer image.');
      } else {
        const feesTotal = result.fees.tax + result.fees.tip + result.fees.service_charge;
        const feesMsg = feesTotal > 0 ? ` + fees` : '';
        const modelMsg = usedModel === 'qwen' ? ' (via fallback)' : '';
        toast.success(`Found ${items.length} items${feesMsg}${modelMsg}`);
      }

      return finalResult;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse receipt';
      setError(message);
      toast.error(message);
      return emptyResult;
    } finally {
      setIsLoading(false);
    }
  };

  return { parseReceipt, isLoading, error };
}

import { useState } from 'react';
import { toast } from 'sonner';
import type { ExpenseItem, ExpenseFees } from '@/stores/paintStore';
import { useSettingsStore } from '@/stores/settingsStore';

export interface ParsedReceiptData {
  items: ExpenseItem[];
  fees: ExpenseFees;
  subtotal: number;
}

interface UseReceiptOCRResult {
  parseReceipt: (file: File) => Promise<ParsedReceiptData>;
  isLoading: boolean;
  error: string | null;
}

export function useReceiptOCR(): UseReceiptOCRResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ocrModel } = useSettingsStore();

  const parseReceipt = async (file: File): Promise<ParsedReceiptData> => {
    setIsLoading(true);
    setError(null);

    const emptyResult: ParsedReceiptData = {
      items: [],
      fees: { tax: 0, tip: 0, service_charge: 0, discount: 0 },
      subtotal: 0
    };

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('Sending receipt to AI for parsing...');

      // Extract base64 data (remove data URL prefix if present)
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

      let result = {
        items: [] as Array<{ name: string; price: number; quantity: number }>,
        fees: { tax: 0, tip: 0, service_charge: 0, discount: 0 },
        subtotal: 0
      };

      const promptText = `You are an expert receipt/invoice parser. Your job is to extract data from this receipt image.

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

      if (ocrModel === 'qwen') {
        // OpenRouter Qwen API
        const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
          throw new Error('VITE_OPENROUTER_API_KEY is not configured. Get your API key from https://openrouter.ai/keys');
        }

        console.log('Using Qwen 2.5 VL 7B via OpenRouter...');

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Bill Painter'
          },
          body: JSON.stringify({
            model: 'qwen/qwen-2.5-vl-7b-instruct:free',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: promptText
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: base64
                    }
                  }
                ]
              }
            ]
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('OpenRouter API error:', response.status, errorData);
          
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
          if (response.status === 402) {
            throw new Error('Insufficient credits. Please add funds to OpenRouter.');
          }
          if (response.status === 403 || response.status === 401) {
            throw new Error('Invalid API key. Check your VITE_OPENROUTER_API_KEY in .env file.');
          }
          throw new Error(errorData?.error?.message || 'Failed to parse receipt');
        }

        const data = await response.json();
        console.log('Qwen Response:', JSON.stringify(data, null, 2));

        // Parse OpenRouter/OpenAI-compatible response
        const messageContent = data.choices?.[0]?.message?.content;
        if (messageContent) {
          try {
            // Try to extract JSON from the response
            const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              result.items = parsed.items || [];
              result.fees = {
                tax: parsed.fees?.tax || 0,
                tip: parsed.fees?.tip || 0,
                service_charge: parsed.fees?.service_charge || 0,
                discount: parsed.fees?.discount || 0
              };
              result.subtotal = parsed.subtotal || result.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            } else {
              throw new Error('No JSON found in response');
            }
          } catch (e) {
            console.error('Failed to parse Qwen response:', e);
            throw new Error('Invalid response format from AI');
          }
        } else {
          throw new Error('No content received from AI');
        }
      } else {
        // Gemini API
        const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
          throw new Error('VITE_GEMINI_API_KEY is not configured. Get your API key from https://aistudio.google.com/app/apikey');
        }

        console.log('Using Gemini 2.5 Flash Image...');

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: promptText
                    },
                    {
                      inline_data: {
                        mime_type: 'image/jpeg',
                        data: base64Data
                      }
                    }
                  ]
                }
              ],
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
          console.error('Gemini API error:', response.status, errorData);
          
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
          if (response.status === 403) {
            throw new Error('Invalid API key. Check your VITE_GEMINI_API_KEY in .env file.');
          }
          throw new Error(errorData?.error?.message || 'Failed to parse receipt');
        }

        const data = await response.json();
        console.log('Gemini Response:', JSON.stringify(data, null, 2));

        // Parse Gemini response
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textContent) {
          try {
            const parsed = JSON.parse(textContent);
            result.items = parsed.items || [];
            result.fees = {
              tax: parsed.fees?.tax || 0,
              tip: parsed.fees?.tip || 0,
              service_charge: parsed.fees?.service_charge || 0,
              discount: parsed.fees?.discount || 0
            };
            result.subtotal = parsed.subtotal || result.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          } catch (e) {
            console.error('Failed to parse Gemini response:', e);
            throw new Error('Invalid response format from AI');
          }
        } else {
          throw new Error('No content received from AI');
        }
      }

      const rawItems = result.items;
      
      // Add unique IDs to each item
      const items: ExpenseItem[] = rawItems.map((item: any, index: number) => ({
        id: `item-${Date.now()}-${index}`,
        name: item.name || 'Unknown Item',
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
        quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1,
      }));

      // Extract fees
      const fees: ExpenseFees = {
        tax: result.fees.tax || 0,
        tip: result.fees.tip || 0,
        service_charge: result.fees.service_charge || 0,
        discount: result.fees.discount || 0,
      };

      const subtotal = result.subtotal || items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      console.log('Parsed receipt data:', { items, fees, subtotal });
      
      if (items.length === 0) {
        toast.warning('No items found in receipt. Try a clearer image.');
      } else {
        const feesTotal = fees.tax + fees.tip + fees.service_charge;
        const feesMsg = feesTotal > 0 ? ` + fees detected` : '';
        toast.success(`Found ${items.length} items${feesMsg}`);
      }

      return { items, fees, subtotal };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse receipt';
      setError(message);
      toast.error(message);
      console.error('Receipt OCR error:', err);
      return emptyResult;
    } finally {
      setIsLoading(false);
    }
  };

  return { parseReceipt, isLoading, error };
}

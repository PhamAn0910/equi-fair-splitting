import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/clerk-react';
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

export function useReceiptOCR(): UseReceiptOCRResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const parseReceipt = async (file: File): Promise<ParsedReceiptData> => {
    setIsLoading(true);
    setError(null);

    const emptyResult: ParsedReceiptData = {
      items: [],
      fees: { tax: 0, tip: 0, service_charge: 0, discount: 0 },
      subtotal: 0
    };

    try {
      // Read file as base64 data URL
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const mimeType = file.type || 'image/jpeg';

      // Get auth token for the API call
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        throw new Error('Not authenticated. Please sign in and try again.');
      }

      // Call the server-side API endpoint
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ imageBase64, mimeType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Server error: ${response.status}`);
      }

      const result = await response.json();

      // Add unique IDs to items (server returns raw items without client IDs)
      const items: ExpenseItem[] = (result.items || []).map((item: any, index: number) => ({
        id: `item-${Date.now()}-${index}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const finalResult: ParsedReceiptData = {
        items,
        fees: result.fees || { tax: 0, tip: 0, service_charge: 0, discount: 0 },
        subtotal: result.subtotal || 0,
        usedModel: result.usedModel,
      };

      console.log('Parsed receipt data:', finalResult);

      if (items.length === 0) {
        toast.warning('No items found in receipt. Try a clearer image.');
      } else {
        const feesTotal = (result.fees?.tax || 0) + (result.fees?.tip || 0) + (result.fees?.service_charge || 0);
        const feesMsg = feesTotal > 0 ? ` + fees` : '';
        const modelMsg = result.usedModel === 'qwen' ? ' (via fallback)' : '';
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

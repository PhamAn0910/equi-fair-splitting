import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ExpenseItem, ExpenseFees } from '@/stores/paintStore';

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

      const { data, error: fnError } = await supabase.functions.invoke('parse-receipt', {
        body: { imageBase64: base64 }
      });

      if (fnError) {
        console.error('Function error:', fnError);
        throw new Error(fnError.message || 'Failed to parse receipt');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const rawItems = data?.items || [];
      
      // Add unique IDs to each item
      const items: ExpenseItem[] = rawItems.map((item: any, index: number) => ({
        id: `item-${Date.now()}-${index}`,
        name: item.name || 'Unknown Item',
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
        quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1,
      }));

      // Extract fees
      const fees: ExpenseFees = {
        tax: data?.fees?.tax || 0,
        tip: data?.fees?.tip || 0,
        service_charge: data?.fees?.service_charge || 0,
        discount: data?.fees?.discount || 0,
      };

      const subtotal = data?.subtotal || items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ParsedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface UseReceiptOCRResult {
  parseReceipt: (file: File) => Promise<ParsedItem[]>;
  isLoading: boolean;
  error: string | null;
}

export function useReceiptOCR(): UseReceiptOCRResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseReceipt = async (file: File): Promise<ParsedItem[]> => {
    setIsLoading(true);
    setError(null);

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

      const items = data?.items || [];
      
      // Add unique IDs to each item
      const parsedItems: ParsedItem[] = items.map((item: any, index: number) => ({
        id: `item-${Date.now()}-${index}`,
        name: item.name || 'Unknown Item',
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
        quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1,
      }));

      console.log('Parsed items:', parsedItems);
      
      if (parsedItems.length === 0) {
        toast.warning('No items found in receipt. Try a clearer image.');
      } else {
        toast.success(`Found ${parsedItems.length} items`);
      }

      return parsedItems;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse receipt';
      setError(message);
      toast.error(message);
      console.error('Receipt OCR error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return { parseReceipt, isLoading, error };
}

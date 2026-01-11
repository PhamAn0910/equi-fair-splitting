import { useState } from 'react';
import { X, Check, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MemberAvatar } from './MemberAvatar';
import type { GroupMember } from '@/stores/groupStore';

interface ScanConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Array<{ id: string; name: string; colorHex: string; isAdmin?: boolean }>;
  totalAmount: number;
  currency: string;
  memberBreakdowns: Array<{ memberId: string; name: string; colorHex: string; grandTotal: number }>;
  onConfirm: (data: { payerId: string; description: string; category: Category }) => void;
}

type Category = 'food' | 'transport' | 'drinks' | 'shopping' | 'entertainment' | 'accommodation' | 'other';

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: 'food', label: 'Food', emoji: '🍽️' },
  { value: 'transport', label: 'Transport', emoji: '🚗' },
  { value: 'drinks', label: 'Drinks', emoji: '🍺' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { value: 'accommodation', label: 'Accommodation', emoji: '🏨' },
  { value: 'other', label: 'Other', emoji: '📝' },
];

export function ScanConfirmDialog({
  open,
  onOpenChange,
  members,
  totalAmount,
  currency,
  memberBreakdowns,
  onConfirm,
}: ScanConfirmDialogProps) {
  // Set default payer to admin (You)
  const defaultPayer = members.find(m => m.isAdmin) || members[0];
  const [payerId, setPayerId] = useState<string>(defaultPayer?.id || '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('food');

  const handleConfirm = () => {
    onConfirm({
      payerId: payerId || defaultPayer?.id || '',
      description: description.trim() || 'Scanned Receipt',
      category,
    });
    // Reset form
    setDescription('');
    setCategory('food');
  };

  const handleClose = () => {
    onOpenChange(false);
    setDescription('');
    setCategory('food');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Confirm Split
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description
            </label>
            <Input
              placeholder="What was it for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Category
            </label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Paid By */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Paid by
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setPayerId(member.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all',
                    payerId === member.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: member.colorHex }}
                  />
                  <span className="text-sm font-medium">{member.name}</span>
                  {payerId === member.id && (
                    <Check className="w-3 h-3 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Split Summary */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Split Summary
            </label>
            <div className="space-y-2 p-3 bg-muted/50 rounded-xl">
              {memberBreakdowns
                .filter(b => b.grandTotal > 0)
                .map((breakdown) => (
                  <div key={breakdown.memberId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: breakdown.colorHex }}
                      />
                      <span className="text-sm text-muted-foreground">{breakdown.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(breakdown.grandTotal, currency)}
                    </span>
                  </div>
                ))}
              <div className="border-t border-border pt-2 mt-2 flex justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-sm font-bold">{formatCurrency(totalAmount, currency)}</span>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <Button 
            className="w-full gap-2"
            size="lg"
            onClick={handleConfirm}
          >
            Add Expense
            <Check className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

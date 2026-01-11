import { useState, useEffect } from 'react';
import { X, Check, Plus, Minus, User, Receipt, ChevronDown } from 'lucide-react';
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
import { useExpenseStore, calculateSplits, type SplitMethod, type ExpenseSplit } from '@/stores/expenseStore';
import type { GroupMember, Group } from '@/stores/groupStore';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  onSuccess?: () => void;
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

export function AddExpenseDialog({ open, onOpenChange, group, onSuccess }: AddExpenseDialogProps) {
  const { addExpense } = useExpenseStore();
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState<string>('');
  const [category, setCategory] = useState<Category>('food');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  
  // Split assignments: memberId -> value (shares/percentage/amount)
  const [splitValues, setSplitValues] = useState<Record<string, number>>({});
  const [includedMembers, setIncludedMembers] = useState<Set<string>>(new Set());
  
  // Initialize with all members included
  useEffect(() => {
    if (open && group.members.length > 0) {
      const allMemberIds = new Set(group.members.map(m => m.id));
      setIncludedMembers(allMemberIds);
      
      // Set default payer to admin (You)
      const admin = group.members.find(m => m.isAdmin);
      if (admin) {
        setPayerId(admin.id);
      }
      
      // Initialize split values
      const initialValues: Record<string, number> = {};
      group.members.forEach(m => {
        initialValues[m.id] = splitMethod === 'equal' ? 1 : 
                             splitMethod === 'shares' ? 1 :
                             splitMethod === 'percentage' ? 100 / group.members.length :
                             0;
      });
      setSplitValues(initialValues);
    }
  }, [open, group.members, splitMethod]);

  // Reset form
  const resetForm = () => {
    setDescription('');
    setAmount('');
    setPayerId('');
    setCategory('food');
    setSplitMethod('equal');
    setSplitValues({});
    setIncludedMembers(new Set());
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const numericAmount = parseFloat(amount) || 0;
  
  // Calculate current splits
  const currentSplits = Array.from(includedMembers).map(memberId => ({
    memberId,
    value: splitValues[memberId] || (splitMethod === 'shares' ? 1 : 0),
  }));
  
  const calculatedSplits = calculateSplits(numericAmount, currentSplits, splitMethod);
  
  // Validation
  const totalAssigned = calculatedSplits.reduce((sum, s) => sum + s.calculatedAmount, 0);
  const isFullyAssigned = Math.abs(totalAssigned - numericAmount) < 0.01;
  const totalPercentage = currentSplits.reduce((sum, s) => sum + s.value, 0);
  const isPercentageValid = splitMethod !== 'percentage' || Math.abs(totalPercentage - 100) < 0.01;
  
  const canSubmit = description.trim() && 
                    numericAmount > 0 && 
                    payerId && 
                    includedMembers.size > 0 &&
                    isFullyAssigned &&
                    isPercentageValid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    
    addExpense({
      groupId: group.id,
      description: description.trim(),
      totalAmount: numericAmount,
      currency: group.currency,
      payerId,
      date: new Date().toISOString(),
      splitMethod,
      splits: calculatedSplits,
      category,
    });
    
    handleClose();
    onSuccess?.();
  };

  const toggleMember = (memberId: string) => {
    const newIncluded = new Set(includedMembers);
    if (newIncluded.has(memberId)) {
      newIncluded.delete(memberId);
    } else {
      newIncluded.add(memberId);
      // Set default value for newly added member
      if (!splitValues[memberId]) {
        setSplitValues(prev => ({
          ...prev,
          [memberId]: splitMethod === 'shares' ? 1 : 0,
        }));
      }
    }
    setIncludedMembers(newIncluded);
  };

  const updateSplitValue = (memberId: string, value: number) => {
    setSplitValues(prev => ({
      ...prev,
      [memberId]: Math.max(0, value),
    }));
  };

  const handleMethodChange = (method: SplitMethod) => {
    setSplitMethod(method);
    
    // Reset values based on new method
    const newValues: Record<string, number> = {};
    group.members.forEach(m => {
      if (includedMembers.has(m.id)) {
        newValues[m.id] = method === 'equal' ? 1 :
                         method === 'shares' ? 1 :
                         method === 'percentage' ? 100 / includedMembers.size :
                         0;
      }
    });
    setSplitValues(newValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Add Expense
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

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Total Amount ({group.currency})
            </label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-semibold"
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
              {group.members.map((member) => (
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

          {/* Split Method */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Split method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['equal', 'shares', 'percentage', 'amounts'] as SplitMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleMethodChange(method)}
                  className={cn(
                    'py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all',
                    splitMethod === method
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  )}
                >
                  {method === 'amounts' ? 'Amount' : method}
                </button>
              ))}
            </div>
          </div>

          {/* Split Assignments */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Split between
            </label>
            <div className="space-y-3">
              {group.members.map((member) => {
                const isIncluded = includedMembers.has(member.id);
                const splitData = calculatedSplits.find(s => s.memberId === member.id);
                const currentValue = splitValues[member.id] || 0;
                
                return (
                  <div
                    key={member.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                      isIncluded ? 'border-primary/30 bg-card' : 'border-border bg-muted/30'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={cn(
                        'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                        isIncluded 
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground'
                      )}
                    >
                      {isIncluded && <Check className="w-3 h-3" />}
                    </button>
                    
                    <MemberAvatar
                      name={member.name}
                      colorHex={member.colorHex}
                      size="sm"
                    />
                    
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{member.name}</p>
                      {member.isAdmin && (
                        <p className="text-xs text-muted-foreground">Organizer</p>
                      )}
                    </div>
                    
                    {isIncluded && splitMethod !== 'equal' && (
                      <div className="flex items-center gap-2">
                        {splitMethod === 'shares' && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateSplitValue(member.id, currentValue - 1)}
                              className="p-1 rounded-full hover:bg-muted"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{currentValue}</span>
                            <button
                              type="button"
                              onClick={() => updateSplitValue(member.id, currentValue + 1)}
                              className="p-1 rounded-full hover:bg-muted"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        
                        {splitMethod === 'percentage' && (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={currentValue}
                              onChange={(e) => updateSplitValue(member.id, parseFloat(e.target.value) || 0)}
                              className="w-16 h-8 text-center text-sm"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        )}
                        
                        {splitMethod === 'amounts' && (
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">{group.currency}</span>
                            <Input
                              type="number"
                              value={currentValue}
                              onChange={(e) => updateSplitValue(member.id, parseFloat(e.target.value) || 0)}
                              className="w-20 h-8 text-right text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {isIncluded && (
                      <div className="text-right min-w-16">
                        <p className="font-semibold text-foreground">
                          {formatCurrency(splitData?.calculatedAmount || 0, group.currency)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add member hint */}
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add person to split
          </button>

          {/* Summary */}
          {numericAmount > 0 && (
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total assigned</span>
                <span className={cn(
                  'font-semibold flex items-center gap-1',
                  isFullyAssigned ? 'text-success' : 'text-destructive'
                )}>
                  {isFullyAssigned && <Check className="w-4 h-4" />}
                  {splitMethod === 'percentage' 
                    ? `${totalPercentage.toFixed(0)}%` 
                    : formatCurrency(totalAssigned, group.currency)
                  }
                </span>
              </div>
              {!isFullyAssigned && splitMethod === 'amounts' && (
                <p className="text-xs text-destructive mt-1">
                  {totalAssigned < numericAmount 
                    ? `Missing ${formatCurrency(numericAmount - totalAssigned, group.currency)}`
                    : `Over by ${formatCurrency(totalAssigned - numericAmount, group.currency)}`
                  }
                </p>
              )}
              {!isPercentageValid && splitMethod === 'percentage' && (
                <p className="text-xs text-destructive mt-1">
                  Percentages must add up to 100%
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 gap-2"
            >
              Save
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

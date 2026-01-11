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
  // Track members that have been manually edited (don't auto-balance them)
  const [manuallyEdited, setManuallyEdited] = useState<Set<string>>(new Set());
  
  // Initialize with all members included (only when dialog opens)
  useEffect(() => {
    if (open && group.members.length > 0) {
      const allMemberIds = new Set(group.members.map(m => m.id));
      setIncludedMembers(allMemberIds);
      
      // Set default payer to admin (You) - only on initial open
      const admin = group.members.find(m => m.isAdmin);
      if (admin && !payerId) {
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
  }, [open, group.members]);

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

  const updateSplitValue = (memberId: string, value: number, autoBalance = false) => {
    const newValue = Math.max(0, value);
    
    // Mark this member as manually edited
    setManuallyEdited(prev => new Set(prev).add(memberId));
    
    if (autoBalance && includedMembers.size > 1) {
      const includedMemberIds = Array.from(includedMembers);
      // Only auto-balance members that haven't been manually edited
      const adjustableMembers = includedMemberIds.filter(id => id !== memberId && !manuallyEdited.has(id));
      
      if (adjustableMembers.length === 0) {
        // All others are manually edited, just update this one
        setSplitValues(prev => ({ ...prev, [memberId]: newValue }));
        return;
      }
      
      if (splitMethod === 'percentage') {
        // Calculate remaining percentage after accounting for this member and other manually edited members
        const manuallyEditedTotal = Array.from(manuallyEdited)
          .filter(id => id !== memberId && includedMemberIds.includes(id))
          .reduce((sum, id) => sum + (splitValues[id] || 0), 0);
        const remaining = 100 - newValue - manuallyEditedTotal;
        const adjustableTotalCurrent = adjustableMembers.reduce((sum, id) => sum + (splitValues[id] || 0), 0);
        
        setSplitValues(prev => {
          const updated = { ...prev, [memberId]: newValue };
          
          if (adjustableTotalCurrent > 0) {
            // Distribute proportionally among adjustable members
            adjustableMembers.forEach(id => {
              const proportion = (prev[id] || 0) / adjustableTotalCurrent;
              updated[id] = Math.max(0, Math.round(remaining * proportion * 100) / 100);
            });
          } else if (adjustableMembers.length > 0) {
            // Equal distribution if all adjustable are 0
            const perMember = remaining / adjustableMembers.length;
            adjustableMembers.forEach(id => {
              updated[id] = Math.max(0, Math.round(perMember * 100) / 100);
            });
          }
          
          return updated;
        });
      } else if (splitMethod === 'amounts') {
        // Calculate remaining amount after accounting for this member and other manually edited members
        const manuallyEditedTotal = Array.from(manuallyEdited)
          .filter(id => id !== memberId && includedMemberIds.includes(id))
          .reduce((sum, id) => sum + (splitValues[id] || 0), 0);
        const remaining = numericAmount - newValue - manuallyEditedTotal;
        const adjustableTotalCurrent = adjustableMembers.reduce((sum, id) => sum + (splitValues[id] || 0), 0);
        
        setSplitValues(prev => {
          const updated = { ...prev, [memberId]: newValue };
          
          if (adjustableTotalCurrent > 0) {
            // Distribute proportionally among adjustable members
            adjustableMembers.forEach(id => {
              const proportion = (prev[id] || 0) / adjustableTotalCurrent;
              updated[id] = Math.max(0, Math.round(remaining * proportion * 100) / 100);
            });
          } else if (adjustableMembers.length > 0) {
            // Equal distribution if all adjustable are 0
            const perMember = remaining / adjustableMembers.length;
            adjustableMembers.forEach(id => {
              updated[id] = Math.max(0, Math.round(perMember * 100) / 100);
            });
          }
          
          return updated;
        });
      } else {
        setSplitValues(prev => ({ ...prev, [memberId]: newValue }));
      }
    } else {
      setSplitValues(prev => ({ ...prev, [memberId]: newValue }));
    }
  };

  const handleMethodChange = (method: SplitMethod) => {
    setSplitMethod(method);
    // Clear manually edited tracking when switching methods
    setManuallyEdited(new Set());
    
    // Reset values based on new method
    const newValues: Record<string, number> = {};
    const includedCount = includedMembers.size || 1;
    group.members.forEach(m => {
      if (includedMembers.has(m.id)) {
        newValues[m.id] = method === 'equal' ? 1 :
                         method === 'shares' ? 1 :
                         method === 'percentage' ? Math.round(100 / includedCount) :
                         method === 'amounts' ? Math.round((numericAmount / includedCount) * 100) / 100 :
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
              Total Amount
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
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              {(['equal', 'shares', 'percentage', 'amounts'] as SplitMethod[]).map((method) => {
                const getLabel = () => {
                  if (method === 'percentage') return '%';
                  if (method === 'amounts') return 'Amount';
                  return method;
                };
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => handleMethodChange(method)}
                    className={cn(
                      'py-2 px-1 sm:px-3 rounded-lg text-xs sm:text-sm font-medium capitalize transition-all',
                      splitMethod === method
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    )}
                  >
                    {getLabel()}
                  </button>
                );
              })}
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
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {splitMethod === 'shares' && (
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            <button
                              type="button"
                              onClick={() => updateSplitValue(member.id, currentValue - 1)}
                              className="p-1 rounded-full hover:bg-muted"
                            >
                              <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <span className="w-6 sm:w-8 text-center font-medium text-sm">{currentValue}</span>
                            <button
                              type="button"
                              onClick={() => updateSplitValue(member.id, currentValue + 1)}
                              className="p-1 rounded-full hover:bg-muted"
                            >
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        )}
                        
                        {splitMethod === 'percentage' && (
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            <button
                              type="button"
                              onClick={() => updateSplitValue(member.id, currentValue - 1, true)}
                              className="p-1 rounded-full hover:bg-muted"
                            >
                              <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <input
                                type="number"
                                inputMode="numeric"
                                value={Math.round(currentValue)}
                                onChange={(e) => updateSplitValue(member.id, parseFloat(e.target.value) || 0, true)}
                                className="w-7 sm:w-10 text-center font-medium text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-xs sm:text-sm font-medium text-muted-foreground">%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateSplitValue(member.id, currentValue + 1, true)}
                              className="p-1 rounded-full hover:bg-muted"
                            >
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        )}
                        
                        {splitMethod === 'amounts' && (
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            <button
                              type="button"
                              onClick={() => updateSplitValue(member.id, currentValue - 1, true)}
                              className="p-1 rounded-full hover:bg-muted"
                            >
                              <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              value={currentValue.toFixed(2)}
                              onChange={(e) => updateSplitValue(member.id, parseFloat(e.target.value) || 0, true)}
                              className="w-12 sm:w-14 text-center font-medium text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateSplitValue(member.id, currentValue + 1, true)}
                              className="p-1 rounded-full hover:bg-muted"
                            >
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {isIncluded && (
                      <div className="text-right min-w-12 sm:min-w-16">
                        <p className="font-semibold text-foreground text-xs sm:text-sm">
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

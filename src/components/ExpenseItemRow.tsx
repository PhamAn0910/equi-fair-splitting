import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/constants';
import type { Member } from '@/stores/paintStore';

interface ExpenseItemRowProps {
  name: string;
  price: number;
  quantity: number;
  currency?: string;
  assignees: Member[];
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ExpenseItemRow({
  name,
  price,
  quantity,
  currency = 'EUR',
  assignees,
  isSelected = false,
  onClick,
  className,
}: ExpenseItemRowProps) {
  const total = price * quantity;
  const hasAssignees = assignees.length > 0;
  const isMultiSplit = assignees.length > 1;
  
  // Generate gradient for multi-split
  const gradientStyle = isMultiSplit
    ? {
        background: `linear-gradient(135deg, ${assignees.map((a, i) => 
          `${a.colorHex} ${(i / assignees.length) * 100}%, ${a.colorHex} ${((i + 1) / assignees.length) * 100}%`
        ).join(', ')})`,
      }
    : hasAssignees
    ? { backgroundColor: assignees[0].colorHex }
    : {};

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-150',
        'border-2 border-transparent',
        hasAssignees 
          ? 'bg-card' 
          : 'bg-muted/50 hover:bg-muted',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        className
      )}
    >
      {/* Color indicator */}
      <div
        className={cn(
          'w-3 h-3 rounded-full flex-shrink-0 transition-all',
          !hasAssignees && 'bg-muted-foreground/30'
        )}
        style={gradientStyle}
      />
      
      {/* Item info */}
      <div className="flex-1 text-left">
        <p className={cn(
          'font-medium',
          hasAssignees ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {name}
        </p>
        {!hasAssignees && (
          <p className="text-xs text-muted-foreground">Tap to assign</p>
        )}
        {isMultiSplit && (
          <p className="text-xs text-muted-foreground">
            {assignees.map(a => a.name).join(' & ')}
          </p>
        )}
        {hasAssignees && !isMultiSplit && (
          <p className="text-xs" style={{ color: assignees[0].colorHex }}>
            {assignees[0].name}
          </p>
        )}
      </div>
      
      {/* Price */}
      <div className="text-right">
        <p className={cn(
          'font-semibold',
          hasAssignees ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {formatCurrency(total, currency)}
        </p>
        {quantity > 1 && (
          <p className="text-xs text-muted-foreground">
            {quantity}x {formatCurrency(price, currency)}
          </p>
        )}
        {isMultiSplit && (
          <p className="text-xs text-muted-foreground">
            ÷{assignees.length} = {formatCurrency(total / assignees.length, currency)} each
          </p>
        )}
      </div>
    </button>
  );
}

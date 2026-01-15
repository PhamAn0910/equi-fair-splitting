import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/constants';
import { Receipt, Utensils, Car, Coffee, ShoppingBag, Film, Hotel } from 'lucide-react';

const categoryIcons = {
  food: Utensils,
  transport: Car,
  drinks: Coffee,
  shopping: ShoppingBag,
  entertainment: Film,
  accommodation: Hotel,
  other: Receipt,
};

interface ActivityItemProps {
  description: string;
  category?: keyof typeof categoryIcons;
  paidBy: string;
  date: string;
  amount: number;
  currency?: string;
  isOwed?: boolean; // true = you owe, false = they owe you
  className?: string;
}

export function ActivityItem({
  description,
  category = 'other',
  paidBy,
  date,
  amount,
  currency = 'EUR',
  isOwed,
  className,
}: ActivityItemProps) {
  const Icon = categoryIcons[category];
  
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl bg-card',
      className
    )}>
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{description}</p>
        <p className="text-sm text-muted-foreground">
          Paid by {paidBy} • {date}
        </p>
      </div>
      
      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p 
          className="font-semibold"
          style={{
            color: isOwed === undefined 
              ? undefined
              : isOwed 
                ? 'rgb(231, 110, 80)' 
                : '#3b761f'
          }}
        >
          {isOwed === undefined ? '' : isOwed ? '-' : '+'}
          {formatCurrency(amount, currency)}
        </p>
        {isOwed !== undefined && (
          <p className="text-xs text-muted-foreground">
            {isOwed ? 'You owe' : 'Owes you'}
          </p>
        )}
      </div>
    </div>
  );
}

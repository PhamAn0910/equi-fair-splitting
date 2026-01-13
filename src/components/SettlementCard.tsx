import { ArrowRight, Check } from 'lucide-react';
import { MemberAvatar } from './MemberAvatar';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export interface Settlement {
  id: string;
  fromMemberId: string;
  fromMemberName: string;
  fromMemberColor: string;
  toMemberId: string;
  toMemberName: string;
  toMemberColor: string;
  amount: number;
  description: string;
  status: 'pending' | 'settled';
  isYouOwing: boolean;
  isOwedToYou: boolean;
}

interface SettlementCardProps {
  settlement: Settlement;
  currency: string;
  onMarkAsPaid?: (settlementId: string) => void;
  onClick?: () => void;
}

export function SettlementCard({ 
  settlement, 
  currency, 
  onMarkAsPaid,
  onClick 
}: SettlementCardProps) {
  const { 
    fromMemberName, 
    fromMemberColor, 
    toMemberName, 
    toMemberColor, 
    amount, 
    description, 
    status,
    isYouOwing,
    isOwedToYou 
  } = settlement;

  const isSettled = status === 'settled';

  // Build the title
  let title = '';
  if (isYouOwing) {
    title = `You owe ${toMemberName}`;
  } else if (isOwedToYou) {
    title = `${fromMemberName} owes you`;
  } else {
    title = `${fromMemberName} paid ${toMemberName}`;
  }

  return (
    <div 
      className={cn(
        'bg-card rounded-xl p-4 transition-all',
        onClick && 'cursor-pointer hover:bg-card/80',
        isSettled && 'opacity-60'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Avatars with arrow */}
        <div className="flex items-center">
          <MemberAvatar
            name={fromMemberName}
            colorHex={fromMemberColor}
            size="sm"
          />
          <ArrowRight className="w-4 h-4 text-muted-foreground mx-1" />
          <MemberAvatar
            name={toMemberName}
            colorHex={toMemberColor}
            size="sm"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{title}</p>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>

        {/* Amount and status */}
        <div className="flex flex-col items-end">
          <p 
            className="font-semibold"
            style={{
              color: isSettled 
                ? undefined
                : isYouOwing 
                  ? 'rgb(231, 110, 80)' 
                  : '#7b8763'
            }}
          >
            {currency}{amount.toFixed(2)}
          </p>
          {isSettled ? (
            <span className="text-xs text-muted-foreground">Settled</span>
          ) : !isYouOwing && (
            <span className="text-xs text-warning">Pending</span>
          )}
        </div>
      </div>

      {/* Mark as Paid button - only show for "you owe" and pending */}
      {isYouOwing && !isSettled && onMarkAsPaid && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsPaid(settlement.id);
          }}
          className="w-full mt-3 gap-2"
        >
          Mark as Paid
          <Check className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

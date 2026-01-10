import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/constants';
import { MemberAvatar } from './MemberAvatar';
import { ChevronRight } from 'lucide-react';
import type { GroupMember } from '@/stores/groupStore';

interface BalanceCardProps {
  groupName: string;
  currency: string;
  yourBalance: number;
  totalSpend: number;
  members: GroupMember[];
  onClick?: () => void;
  className?: string;
}

export function BalanceCard({
  groupName,
  currency,
  yourBalance,
  totalSpend,
  members,
  onClick,
  className,
}: BalanceCardProps) {
  const isPositive = yourBalance >= 0;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
        'bg-gradient-to-br from-primary to-primary/80',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5" />
      
      {/* Group badge */}
      <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-primary-foreground mb-3">
        <span className="w-2 h-2 rounded-full bg-accent" />
        {groupName}
      </div>
      
      {/* Balance */}
      <div className="relative z-10">
        <p className="text-primary-foreground/70 text-sm mb-1">YOUR BALANCE</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary-foreground">
            {formatCurrency(Math.abs(yourBalance), currency)}
          </span>
          <span className={cn(
            'text-sm font-medium',
            isPositive ? 'text-green-300' : 'text-red-300'
          )}>
            {isPositive ? 'You are owed' : 'You owe'}
          </span>
        </div>
      </div>
      
      {/* Bottom row */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
        {/* Member avatars */}
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center text-xs font-semibold text-white"
                style={{ backgroundColor: member.colorHex }}
              >
                {member.name[0]}
              </div>
            ))}
            {members.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-primary bg-primary-foreground/20 flex items-center justify-center text-xs font-medium text-primary-foreground">
                +{members.length - 4}
              </div>
            )}
          </div>
        </div>
        
        {/* Total spend */}
        <div className="text-right">
          <p className="text-primary-foreground/70 text-xs">TOTAL SPEND</p>
          <p className="text-primary-foreground font-semibold">
            {formatCurrency(totalSpend, currency)}
          </p>
        </div>
      </div>
      
      {/* Chevron indicator */}
      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-foreground/50" />
    </div>
  );
}

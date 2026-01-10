import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary';
  className?: string;
}

export function QuickActionButton({
  icon: Icon,
  label,
  sublabel,
  onClick,
  variant = 'default',
  className,
}: QuickActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200',
        'hover:scale-105 active:scale-95',
        variant === 'default' && 'bg-card border border-border hover:border-primary/30',
        variant === 'primary' && 'bg-primary text-primary-foreground',
        className
      )}
    >
      <Icon className={cn(
        'w-6 h-6 mb-2',
        variant === 'default' ? 'text-foreground' : 'text-primary-foreground'
      )} />
      <span className={cn(
        'text-sm font-medium',
        variant === 'default' ? 'text-foreground' : 'text-primary-foreground'
      )}>
        {label}
      </span>
      {sublabel && (
        <span className={cn(
          'text-xs',
          variant === 'default' ? 'text-muted-foreground' : 'text-primary-foreground/70'
        )}>
          {sublabel}
        </span>
      )}
    </button>
  );
}

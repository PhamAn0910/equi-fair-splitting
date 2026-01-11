import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/constants';

interface MemberAvatarProps {
  name: string;
  colorHex: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isActive?: boolean;
  showName?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export function MemberAvatar({
  name,
  colorHex,
  size = 'md',
  isActive = false,
  showName = false,
  onClick,
  className,
}: MemberAvatarProps) {
  return (
      <div className={cn('flex flex-col items-center gap-1 flex-shrink-0', className)}>
        <button
        type="button"
        onClick={onClick}
        className={cn(
          'rounded-full flex items-center justify-center font-semibold text-white transition-all duration-200',
          sizeClasses[size],
          onClick && 'cursor-pointer hover:scale-105 active:scale-95',
          isActive && 'ring-2 ring-offset-2 ring-offset-background ring-primary'
        )}
        style={{ backgroundColor: colorHex }}
        disabled={!onClick}
      >
        {getInitials(name)}
      </button>
      {showName && (
        <span className={cn(
          'text-xs font-medium truncate max-w-[60px]',
          isActive ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {name}
        </span>
      )}
    </div>
  );
}

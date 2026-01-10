import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingAddButtonProps {
  onClick?: () => void;
  className?: string;
}

export function FloatingAddButton({ onClick, className }: FloatingAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'fixed z-40 w-14 h-14 rounded-full bg-accent text-accent-foreground',
        'flex items-center justify-center shadow-lg',
        'transition-all duration-200 hover:scale-110 active:scale-95',
        'bottom-24 right-4',
        className
      )}
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}

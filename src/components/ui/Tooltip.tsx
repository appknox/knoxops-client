import { useState, type ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TooltipProps {
  content: string;
  children?: ReactNode;
  className?: string;
  /** Use 'sm' for compact action-button tooltips, default is wide info tooltip */
  size?: 'sm' | 'default';
  /** Horizontal alignment of the tooltip relative to the trigger */
  align?: 'center' | 'left' | 'right';
}

export function Tooltip({ content, children, className, size = 'default', align = 'center' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    center: 'left-1/2 -translate-x-1/2 after:left-1/2 after:-translate-x-1/2',
    left: 'left-0 after:left-4',
    right: 'right-0 after:right-4',
  }[align];

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className={children ? undefined : 'cursor-help'}
      >
        {children || <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />}
      </div>
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2.5 py-1.5 text-xs text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none',
            'bottom-full mb-2 whitespace-nowrap',
            'after:content-[""] after:absolute after:top-full after:transform',
            'after:border-4 after:border-transparent after:border-t-gray-900',
            positionClasses,
            size === 'default' && 'min-w-[320px] max-w-[480px] whitespace-normal',
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

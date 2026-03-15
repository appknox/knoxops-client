import { useState, type ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TooltipProps {
  content: string;
  children?: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children || <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />}
      </div>
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg',
            'whitespace-normal min-w-[320px] max-w-[480px]',
            'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
            'after:content-[""] after:absolute after:top-full after:left-1/2 after:transform after:-translate-x-1/2',
            'after:border-4 after:border-transparent after:border-t-gray-900',
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

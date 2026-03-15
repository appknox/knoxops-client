import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { Tooltip } from './Tooltip';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  tooltip?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, tooltip, id, onBlur, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      // Trim whitespace on blur
      const trimmed = e.target.value.trim();
      if (trimmed !== e.target.value) {
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value'
        )?.set;
        nativeTextAreaValueSetter?.call(e.target, trimmed);
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
      }
      onBlur?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1">
            <span className="inline-flex items-center gap-1.5">
              {label}
              {tooltip && <Tooltip content={tooltip} />}
            </span>
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          onBlur={handleBlur}
          className={cn(
            'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'resize-none',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };

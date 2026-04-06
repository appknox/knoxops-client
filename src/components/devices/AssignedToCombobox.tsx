import { useEffect, useRef, useState } from 'react';
import { usersApi } from '@/api/users';
import { Input } from '@/components/ui';
import { X } from 'lucide-react';
import type { User } from '@/types';

interface AssignedToComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export const AssignedToCombobox = ({
  value,
  onChange,
  disabled = false,
  error,
}: AssignedToComboboxProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const justSelectedRef = useRef(false);

  // Sync internal state when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change with debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue); // Keep form value in sync on every keystroke
    setIsOpen(true);
    justSelectedRef.current = false;

    // Clear previous debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce search by 300ms
    debounceTimer.current = setTimeout(async () => {
      if (newValue.trim().length === 0) {
        setSuggestions([]);
        return;
      }

      try {
        setIsLoading(true);
        const results = await usersApi.search(newValue.trim(), 8);
        // Filter to only active users
        setSuggestions(results.filter((u) => u.status === 'active'));
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  // Handle user selection
  const handleSelectUser = (user: User) => {
    const selectedName = `${user.firstName} ${user.lastName}`;
    setInputValue(selectedName);
    onChange(selectedName);
    setIsOpen(false);
    setSuggestions([]);
    justSelectedRef.current = true;
  };

  // Handle input blur
  const handleBlur = () => {
    // Close dropdown after a small delay to allow click on suggestion
    setTimeout(() => {
      // Only accept free-text if we didn't just select a user
      if (!justSelectedRef.current) {
        onChange(inputValue);
      }
      setIsOpen(false);
      justSelectedRef.current = false;
    }, 150);
  };

  // Handle clear button
  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    justSelectedRef.current = false;
  };

  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Input
          label="Assigned To"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search user or type a name..."
          disabled={disabled}
          error={error}
          rightIcon={
            inputValue && !disabled ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null
          }
        />
      </div>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto">
              {suggestions.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectUser(user);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </button>
                </li>
              ))}
            </ul>
          ) : inputValue.trim().length > 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No users found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { usersApi } from '@/api';
import type { User } from '@/types';
import { cn } from '@/utils/cn';
import { Tooltip } from './Tooltip';

interface UserSearchComboboxProps {
  label?: string;
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  error?: string;
  selectedUser?: { id: string; firstName: string; lastName: string; email: string } | null;
  tooltip?: string;
}

const UserSearchCombobox = ({
  label,
  value,
  onChange,
  placeholder = 'Search for a user...',
  error,
  selectedUser,
  tooltip,
}: UserSearchComboboxProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set display value when selectedUser changes (for edit mode)
  useEffect(() => {
    if (selectedUser) {
      setDisplayValue(`${selectedUser.firstName} ${selectedUser.lastName}`);
    } else if (!value) {
      setDisplayValue('');
    }
  }, [selectedUser, value]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await usersApi.search(searchQuery, 10);
        setUsers(results);
      } catch (err) {
        console.error('Failed to search users:', err);
        setUsers([]);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (user: User) => {
    onChange(user.id);
    setDisplayValue(`${user.firstName} ${user.lastName}`);
    setSearchQuery('');
    setIsOpen(false);
    setUsers([]);
  };

  const handleClear = () => {
    onChange('');
    setDisplayValue('');
    setSearchQuery('');
    setUsers([]);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setDisplayValue(val);
    setIsOpen(true);
    if (!val) {
      onChange('');
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (value && displayValue) {
      // When focusing with a selected value, show the search
      setSearchQuery('');
    }
  };

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="inline-flex items-center gap-1.5">
            {label}
            {tooltip && <Tooltip content={tooltip} />}
          </span>
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery || displayValue : displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn(
            'block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 py-2 text-gray-900 placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500'
          )}
        />
        {displayValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Dropdown */}
        {isOpen && (searchQuery || users.length > 0) && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-60 overflow-auto">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">Searching...</div>
            ) : users.length === 0 && searchQuery ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No users found</div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <div className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export { UserSearchCombobox };

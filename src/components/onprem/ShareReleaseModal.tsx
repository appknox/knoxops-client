import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button } from '@/components/ui';
import { AlertCircle, Search, X } from 'lucide-react';
import { releasesApi, type GitHubRelease } from '@/api/releases';
import { onpremApi } from '@/api';

interface ClientSuggestion {
  id: string;
  clientName: string;
  contactEmail: string | null;
}

interface ShareReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: GitHubRelease | null;
  onSuccess?: () => void;
}

const ShareReleaseModal = ({ isOpen, onClose, release, onSuccess }: ShareReleaseModalProps) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSuggestion | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setInputValue('');
    setSuggestions([]);
    setSelectedClient(null);
    setShowDropdown(false);
    setError(null);
    setSuccess(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await onpremApi.searchClients(q.trim());
      setSuggestions(results);
      setShowDropdown(true);
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setSelectedClient(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (client: ClientSuggestion) => {
    setSelectedClient(client);
    setInputValue(client.clientName);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSelectedClient(null);
    setInputValue('');
    setSuggestions([]);
    setShowDropdown(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleShare = async () => {
    if (!selectedClient) {
      setError('Please select a client');
      return;
    }
    if (!selectedClient.contactEmail) {
      setError('Selected client has no contact email registered');
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      await releasesApi.shareWithClients(release!.id, [selectedClient.id]);
      setSuccess(`Email sent to ${selectedClient.clientName}`);
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch {
      setError('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!release) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Share Release</h2>
        <p className="text-sm text-gray-500 mb-5">{release.tagName} — {release.name}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success ? (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        ) : (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>

            {/* Search input */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type client name to search..."
                  value={inputValue}
                  onChange={handleInputChange}
                  disabled={isSending}
                  className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                />
                {(inputValue || selectedClient) && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Dropdown suggestions */}
              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {isSearching ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                  ) : suggestions.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">No clients found</div>
                  ) : (
                    suggestions.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelect(client)}
                        className="w-full flex flex-col px-4 py-3 text-left hover:bg-primary-50 border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900">{client.clientName}</span>
                        <span className="text-xs text-gray-500 mt-0.5">
                          {client.contactEmail ?? <span className="text-amber-600">No contact email</span>}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected client email (read-only) */}
            {selectedClient && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="text"
                  value={selectedClient.contactEmail ?? 'No email registered'}
                  readOnly
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                {!selectedClient.contactEmail && (
                  <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                    Update this client's contact email before sharing.
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-3 justify-end">
              <Button variant="outline" onClick={onClose} disabled={isSending}>
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                disabled={!selectedClient || !selectedClient.contactEmail || isSending}
                isLoading={isSending}
              >
                Send Email
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export { ShareReleaseModal };

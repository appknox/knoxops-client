import { useState, useEffect } from 'react';
import { History, PackageCheck, RefreshCw, UserCheck, Tag, MessageSquare, Pencil, Trash2, Send, X } from 'lucide-react';
import { Modal, Button, Avatar, Textarea } from '@/components/ui';
import { devicesApi } from '@/api';
import { formatDateTime } from '@/utils/formatters';
import { useAuthStore } from '@/stores';
import type { DeviceListItem } from '@/types';

interface HistoryEntry {
  id: string;
  type: 'comment' | 'activity';
  timestamp: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  data: any;
}

interface DeviceAuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceListItem | null;
}

// Status label mapping (same as DeviceStatusBadge)
const statusLabel: Record<string, string> = {
  in_inventory: 'In Inventory',
  checked_out: 'Checked Out',
  maintenance: 'Out for Repair',
  decommissioned: 'Decommissioned',
  for_sale: 'For Sale',
  sold: 'Sold',
  not_verified: 'Not Verified',
};

// Activity action icons and colors
const actionConfig: Record<
  string,
  {
    icon: React.ReactNode;
    label: string;
    bgColor: string;
  }
> = {
  device_created: {
    icon: <PackageCheck className="h-5 w-5 text-green-600" />,
    label: 'Enrolled',
    bgColor: 'bg-green-100',
  },
  status_changed: {
    icon: <RefreshCw className="h-5 w-5 text-blue-600" />,
    label: 'Status Changed',
    bgColor: 'bg-blue-100',
  },
  assigned_to_changed: {
    icon: <UserCheck className="h-5 w-5 text-purple-600" />,
    label: 'Reassigned',
    bgColor: 'bg-purple-100',
  },
  purpose_changed: {
    icon: <Tag className="h-5 w-5 text-orange-600" />,
    label: 'Purpose Changed',
    bgColor: 'bg-orange-100',
  },
};

const ActivityEntry = ({ entry }: { entry: HistoryEntry }) => {
  const action = entry.data.action;
  const config = actionConfig[action];
  if (!config) return null;

  const userName = entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : 'System';

  const getDescription = () => {
    const { before, after } = entry.data.changes || {};
    switch (action) {
      case 'device_created': {
        const status = after?.status || 'in_inventory';
        const assignedTo = after?.assignedTo || null;
        const purpose = after?.purpose || null;
        const statusLabel_ = statusLabel[status] || status;
        const parts: React.ReactNode[] = [];
        if (statusLabel_ && status !== 'in_inventory') parts.push(<span key="status"><span className="font-semibold">Status:</span> {statusLabel_}</span>);
        if (assignedTo) parts.push(<span key="assigned"><span className="font-semibold">Assigned to:</span> {assignedTo}</span>);
        if (purpose) parts.push(<span key="purpose"><span className="font-semibold">Purpose:</span> {purpose}</span>);
        return (
          <div>
            <div>Registered</div>
            {parts.length > 0 && <div className="mt-1">{parts.map((part, idx) => <div key={idx}>{part}</div>)}</div>}
          </div>
        );
      }
      case 'status_changed': {
        const beforeStatus = before?.status ?? 'Unknown';
        const afterStatus = after?.status ?? 'Unknown';
        const beforeLabel = statusLabel[beforeStatus] ?? beforeStatus;
        const afterLabel = statusLabel[afterStatus] ?? afterStatus;
        return (
          <div>
            <span className="font-semibold">Status:</span> {beforeLabel} → {afterLabel}
          </div>
        );
      }
      case 'assigned_to_changed': {
        const beforeName = before?.assignedTo ?? '—';
        const afterName = after?.assignedTo ?? '—';
        return (
          <div>
            <span className="font-semibold">Assigned to:</span> {beforeName} → {afterName}
          </div>
        );
      }
      case 'purpose_changed': {
        const beforePurpose = before?.purpose ?? '—';
        const afterPurpose = after?.purpose ?? '—';
        return (
          <div>
            <span className="font-semibold">Purpose:</span> {beforePurpose} → {afterPurpose}
          </div>
        );
      }
      default:
        return <div>{action}</div>;
    }
  };

  return (
    <div className="flex gap-3 py-4 border-b last:border-0">
      <div className={`h-fit w-fit mt-0.5 p-2 rounded-full ${config.bgColor}`}>{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{config.label}</span>
          <span className="text-xs text-gray-400">{formatDateTime(entry.timestamp)}</span>
        </div>
        <div className="text-sm text-gray-600 mt-0.5">{getDescription()}</div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Avatar name={userName} size="xs" />
          <span className="text-xs text-gray-500">{userName}</span>
        </div>
      </div>
    </div>
  );
};

const CommentEntry = ({
  entry,
  currentUserId,
  onEdit,
  onDelete,
}: {
  entry: HistoryEntry;
  currentUserId?: string;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.data.text || '');
  const isAuthor = currentUserId === entry.user?.id;

  return (
    <div className="flex gap-3 py-4 border-b last:border-0">
      <div className="h-fit w-fit mt-0.5 p-2 rounded-full bg-blue-100">
        <MessageSquare className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Comment</span>
          <span className="text-xs text-gray-400">{formatDateTime(entry.timestamp)}</span>
        </div>
        {isEditing ? (
          <div className="mt-2">
            <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} />
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onEdit(entry.id, editText);
                  setIsEditing(false);
                }}
              >
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mt-2">{entry.data.text}</p>
            {isAuthor && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            )}
          </>
        )}
        <div className="flex items-center gap-1.5 mt-2">
          <Avatar name={`${entry.user?.firstName} ${entry.user?.lastName}`} size="xs" />
          <span className="text-xs text-gray-500">
            {entry.user?.firstName} {entry.user?.lastName}
          </span>
        </div>
      </div>
    </div>
  );
};

const DeviceAuditLogsModal = ({ isOpen, onClose, device }: DeviceAuditLogsModalProps) => {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'comment' | 'activity'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState('');

  const fetchHistory = async (pageNum: number = 1, filterOverride?: typeof filter) => {
    if (!device || !isOpen) return;
    const activeFilter = filterOverride ?? filter;
    setIsLoading(true);
    try {
      const response = await devicesApi.getHistory(device.id, {
        type: activeFilter,
        page: pageNum,
        limit: 20,
      });
      setEntries(response.data);
      setTotalPages(response.pagination.totalPages);
      setPage(pageNum);
    } catch {
      // Error handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && device) {
      fetchHistory(1, filter);
    } else {
      setEntries([]);
      setPage(1);
      setTotalPages(1);
    }
  }, [isOpen, device, filter]);

  const handleAddComment = async () => {
    if (!device || !newComment.trim()) return;
    try {
      await devicesApi.addComment(device.id, newComment);
      setNewComment('');
      setShowAddComment(false);
      fetchHistory(1, filter);
    } catch {
      // Error handled
    }
  };

  const handleEditComment = async (commentId: string, text: string) => {
    if (!device) return;
    try {
      await devicesApi.updateComment(device.id, commentId, text);
      fetchHistory(page, filter);
    } catch {
      // Error handled
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!device || !window.confirm('Delete this comment?')) return;
    try {
      await devicesApi.deleteComment(device.id, commentId);
      fetchHistory(page, filter);
    } catch {
      // Error handled
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Device History" size="lg">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <History className="h-4 w-4 text-gray-500" />
          <span className="text-gray-900 font-medium">
            {device?.name || '—'}
            {device?.model ? ` — ${device.model}` : ''}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAddComment(!showAddComment)}>
          + Add Comment
        </Button>
      </div>

      {showAddComment && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
          />
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleAddComment}>
              <Send className="h-4 w-4 mr-1" />
              Post
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddComment(false)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="px-6 py-3 border-b border-gray-200 flex gap-2">
        {(['all', 'activity', 'comment'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No {filter !== 'all' ? filter : ''} entries found</div>
        ) : (
          <div className="px-6 py-4">
            {entries.map((entry) =>
              entry.type === 'activity' ? (
                <ActivityEntry key={entry.id} entry={entry} />
              ) : (
                <CommentEntry
                  key={entry.id}
                  entry={entry}
                  currentUserId={user?.id}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                />
              )
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchHistory(page - 1, filter)}
            disabled={page === 1}
          >
            ← Prev
          </Button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchHistory(page + 1, filter)}
            disabled={page === totalPages}
          >
            Next →
          </Button>
        </div>
        <Button onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};

export { DeviceAuditLogsModal };

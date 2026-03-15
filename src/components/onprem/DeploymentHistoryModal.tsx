import { useState, useEffect } from 'react';
import { Modal, Button, Textarea } from '@/components/ui';
import { useOnpremStore } from '@/stores';
import { useAuthStore } from '@/stores';
import { MessageSquare, FileText, Activity, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import type { OnpremDeployment, CombinedHistoryEntry } from '@/types';

interface DeploymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: OnpremDeployment | null;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DeploymentHistoryModal = ({ isOpen, onClose, deployment }: DeploymentHistoryModalProps) => {
  const { combinedHistory, combinedHistoryLoading, fetchCombinedHistory, createComment, updateComment, deleteComment } = useOnpremStore();
  const { user } = useAuthStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'comments' | 'activities'>('all');

  useEffect(() => {
    if (isOpen && deployment) {
      fetchCombinedHistory(deployment.id);
    }
  }, [isOpen, deployment, fetchCombinedHistory]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployment || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await createComment(deployment.id, { comment: newComment.trim() });
      setNewComment('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!deployment || !editingCommentText.trim()) return;

    setIsSubmitting(true);
    try {
      await updateComment(deployment.id, commentId, { comment: editingCommentText.trim() });
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!deployment) return;
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment(deployment.id, commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case 'audit':
        return <FileText className="h-5 w-5 text-gray-600" />;
      case 'status_change':
        return <Activity className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getEntryLabel = (entry: CombinedHistoryEntry) => {
    switch (entry.type) {
      case 'comment':
        return 'Comment';
      case 'audit':
        // Format action names nicely
        const action = entry.data?.action || 'activity';
        return action
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      case 'status_change':
        return `Status Changed: ${entry.data?.previousStatus || 'N/A'} → ${entry.data?.newStatus || 'N/A'}`;
      default:
        return 'Activity';
    }
  };

  const renderEntryContent = (entry: CombinedHistoryEntry) => {
    const isEditing = editingCommentId === entry.id;
    const isOwnComment = entry.type === 'comment' && user && entry.data?.createdBy === user.id;

    if (entry.type === 'comment') {
      if (isEditing) {
        return (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editingCommentText}
              onChange={(e) => setEditingCommentText(e.target.value)}
              rows={3}
              className="w-full"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSaveEdit(entry.id)}
                disabled={isSubmitting || !editingCommentText.trim()}
              >
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        );
      }

      const commentText = entry.data?.comment || '';
      const isExpanded = expandedComments.has(entry.id);
      const lines = commentText.split('\n');
      const shouldTruncate = lines.length > 4 || commentText.length > 300;
      const displayText = isExpanded || !shouldTruncate
        ? commentText
        : lines.slice(0, 4).join('\n').substring(0, 300) + (commentText.length > 300 ? '...' : '');

      return (
        <div className="mt-2">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{displayText}</p>
          {shouldTruncate && (
            <button
              onClick={() => {
                const newExpanded = new Set(expandedComments);
                if (isExpanded) {
                  newExpanded.delete(entry.id);
                } else {
                  newExpanded.add(entry.id);
                }
                setExpandedComments(newExpanded);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
          {isOwnComment && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleEditComment(entry.id, entry.data?.comment)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Edit2 className="h-3 w-3" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteComment(entry.id)}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      );
    }

    if (entry.type === 'status_change') {
      return (
        <div className="mt-2">
          {entry.data?.reason && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Reason:</span> {entry.data.reason}
            </p>
          )}
        </div>
      );
    }

    if (entry.type === 'audit') {
      const changes = entry.data?.changes;

      // Fields to exclude from change display (metadata already shown elsewhere)
      const metadataFields = [
        'updatedAt',
        'updatedBy',
        'createdAt',
        'createdBy',
        'registeredBy',
        'lastUpdatedBy',
        'id',
      ];

      // Helper function to format field names
      const formatFieldName = (key: string): string => {
        return key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
      };

      // Helper function to format values
      const formatValue = (value: any): string => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      };

      // Helper to normalize values for comparison
      const normalizeValue = (value: any): any => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'object') return JSON.stringify(value);
        return value;
      };

      // Get changed fields (excluding metadata)
      const getChangedFields = () => {
        if (!changes?.before || !changes?.after) return [];

        const changedFields: Array<{ field: string; before: string; after: string }> = [];
        const beforeObj = changes.before as Record<string, any>;
        const afterObj = changes.after as Record<string, any>;

        Object.keys(afterObj).forEach((key) => {
          // Skip metadata fields
          if (metadataFields.includes(key)) return;

          const beforeVal = normalizeValue(beforeObj[key]);
          const afterVal = normalizeValue(afterObj[key]);

          // Only include if actually changed
          if (beforeVal !== afterVal) {
            changedFields.push({
              field: formatFieldName(key),
              before: formatValue(beforeObj[key]),
              after: formatValue(afterObj[key]),
            });
          }
        });

        return changedFields;
      };

      const changedFields = getChangedFields();
      const userName = entry.user
        ? `${entry.user.firstName} ${entry.user.lastName}`
        : 'Someone';

      return (
        <div className="mt-2 space-y-1">
          {changes && (
            <div className="text-sm text-gray-700">
              {changes.after && !changes.before && (
                <p className="font-medium">{userName} registered this client</p>
              )}
              {changes.before && !changes.after && (
                <p className="font-medium">{userName} deleted this deployment</p>
              )}
              {changes.before && changes.after && changedFields.length > 0 && (
                <div>
                  <p className="font-medium mb-1">{userName} edited the record:</p>
                  <div className="ml-2 space-y-1 text-xs">
                    {changedFields.map(({ field, before, after }) => (
                      <div key={field} className="flex gap-2">
                        <span className="text-gray-600">•</span>
                        <span className="flex-1">
                          <span className="font-medium">{field}:</span>{' '}
                          <span className="text-gray-500">"{before}"</span>
                          <span className="mx-1">→</span>
                          <span className="text-gray-900">"{after}"</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {changes.before && changes.after && changedFields.length === 0 && (
                <p className="text-gray-500 text-xs">Updated metadata only</p>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const getUserInfo = (entry: CombinedHistoryEntry) => {
    const userName = entry.user
      ? `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim() || 'Unknown User'
      : 'System';

    const initials = entry.user && entry.user.firstName && entry.user.lastName
      ? `${entry.user.firstName[0]}${entry.user.lastName[0]}`.toUpperCase()
      : 'S';

    return (
      <div
        className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 cursor-help"
        title={userName}
      >
        {initials}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="History & Comments" size="xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="px-4 pt-2">
          <p className="text-sm text-gray-600">
            Activity history for <span className="font-semibold text-gray-900">{deployment?.clientName || 'Unknown Client'}</span>
          </p>
        </div>

        {/* Add Comment Form */}
        {showAddForm && (
          <form onSubmit={handleSubmitComment} className="bg-blue-50 rounded-lg p-4 mx-4 space-y-4">
            <Textarea
              label="New Comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your note or comment..."
              rows={4}
              required
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewComment('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                {isSubmitting ? 'Adding...' : 'Add Comment'}
              </Button>
            </div>
          </form>
        )}

        {/* Filter Buttons and Add Comment */}
        <div className="mx-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('comments')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === 'comments'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Comments
            </button>
            <button
              onClick={() => setFilter('activities')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === 'activities'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Activities
            </button>
          </div>
          {!showAddForm && (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Comment
            </Button>
          )}
        </div>

        {/* Combined History Timeline */}
        <div className="mx-4 border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
          {combinedHistoryLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            </div>
          ) : !combinedHistory || combinedHistory.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No activity yet</h3>
              <p className="text-gray-500">Add a comment to start tracking activity.</p>
            </div>
          ) : (() => {
              const filteredHistory = combinedHistory.filter((entry) => {
                if (filter === 'comments') return entry.type === 'comment';
                if (filter === 'activities') return entry.type !== 'comment';
                return true; // 'all'
              });

              if (filteredHistory.length === 0) {
                return (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No {filter === 'comments' ? 'comments' : 'activities'} yet
                    </h3>
                    <p className="text-gray-500">
                      {filter === 'comments'
                        ? 'Add a comment to start the conversation.'
                        : 'No activity recorded yet.'}
                    </p>
                  </div>
                );
              }

              return filteredHistory.map((entry) => {
              if (!entry || !entry.id || !entry.type) {
                console.error('Invalid entry:', entry);
                return null;
              }
              return (
                <div key={`${entry.type}-${entry.id}`} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getEntryIcon(entry.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        {getUserInfo(entry)}
                        <span className="text-xs text-gray-400 ml-2">
                          {entry.timestamp ? formatDate(entry.timestamp) : 'N/A'}
                        </span>
                      </div>
                      {renderEntryContent(entry)}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 px-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export { DeploymentHistoryModal };

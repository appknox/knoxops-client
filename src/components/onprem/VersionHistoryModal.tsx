import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@/components/ui';
import { useOnpremStore } from '@/stores';
import { Plus, History, GitBranch } from 'lucide-react';
import type { OnpremDeployment, VersionActionType } from '@/types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: OnpremDeployment | null;
}

const actionTypeOptions = [
  { value: 'deployment', label: 'Initial Deployment' },
  { value: 'patch', label: 'Patch' },
  { value: 'upgrade', label: 'Upgrade' },
];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const VersionHistoryModal = ({ isOpen, onClose, deployment }: VersionHistoryModalProps) => {
  const { versionHistory, versionHistoryLoading, fetchVersionHistory, addVersion } = useOnpremStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    version: '',
    actionType: 'patch' as VersionActionType,
    patchNotes: '',
  });

  useEffect(() => {
    if (isOpen && deployment) {
      fetchVersionHistory(deployment.id);
    }
  }, [isOpen, deployment, fetchVersionHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployment) return;

    setIsSubmitting(true);
    try {
      await addVersion(deployment.id, formData);
      setFormData({ version: '', actionType: 'patch', patchNotes: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add version:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionIcon = (actionType: VersionActionType) => {
    switch (actionType) {
      case 'deployment':
        return <GitBranch className="h-4 w-4 text-green-600" />;
      case 'patch':
        return <History className="h-4 w-4 text-blue-600" />;
      case 'upgrade':
        return <GitBranch className="h-4 w-4 text-purple-600" />;
    }
  };

  const getActionLabel = (actionType: VersionActionType) => {
    switch (actionType) {
      case 'deployment':
        return 'Deployed';
      case 'patch':
        return 'Patched';
      case 'upgrade':
        return 'Upgraded';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Version History" size="lg">
      <div className="space-y-4">
        {/* Header with Add button */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Version history for <span className="font-medium text-gray-900">{deployment?.clientName}</span>
          </p>
          {!showAddForm && (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Version
            </Button>
          )}
        </div>

        {/* Add Version Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="e.g., 1.2.3"
                required
              />
              <Select
                label="Action Type"
                options={actionTypeOptions}
                value={formData.actionType}
                onChange={(e) => setFormData({ ...formData, actionType: e.target.value as VersionActionType })}
              />
            </div>
            <Textarea
              label="Patch Notes"
              value={formData.patchNotes}
              onChange={(e) => setFormData({ ...formData, patchNotes: e.target.value })}
              placeholder="Describe the changes..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ version: '', actionType: 'patch', patchNotes: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Version'}
              </Button>
            </div>
          </form>
        )}

        {/* Version History List */}
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {versionHistoryLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            </div>
          ) : versionHistory.length === 0 ? (
            <div className="p-8 text-center">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No version history</h3>
              <p className="text-gray-500">Add a version entry to track deployment history.</p>
            </div>
          ) : (
            versionHistory.map((entry) => (
              <div key={entry.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getActionIcon(entry.actionType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">v{entry.version}</span>
                      <span className="text-sm text-gray-500">{getActionLabel(entry.actionType)}</span>
                    </div>
                    {entry.patchNotes && (
                      <p className="mt-1 text-sm text-gray-600">{entry.patchNotes}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                      <span>{formatDate(entry.appliedAt)}</span>
                      {entry.appliedByUser && (
                        <span>
                          by {entry.appliedByUser.firstName} {entry.appliedByUser.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export { VersionHistoryModal };

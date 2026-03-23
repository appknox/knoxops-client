import { useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, Share2 } from 'lucide-react';
import { releasesApi, type GitHubRelease } from '@/api/releases';
import { ShareReleaseModal } from '@/components/onprem/ShareReleaseModal';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ReleasesTab = () => {
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReleases, setExpandedReleases] = useState<Set<number>>(new Set());
  const [shareModalRelease, setShareModalRelease] = useState<GitHubRelease | null>(null);

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await releasesApi.list();
      if (response && response.data && Array.isArray(response.data)) {
        setReleases(response.data);
      } else {
        setError('Invalid response format from server');
        setReleases([]);
      }
    } catch (err) {
      console.error('Failed to fetch releases:', err);
      setError('Failed to load releases. GitHub may not be configured.');
      setReleases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (releaseId: number) => {
    const newExpanded = new Set(expandedReleases);
    if (newExpanded.has(releaseId)) {
      newExpanded.delete(releaseId);
    } else {
      newExpanded.add(releaseId);
    }
    setExpandedReleases(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-700">{error}</p>
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No releases available. Releases not configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {releases.map((release, index) => {
        const isExpanded = expandedReleases.has(release.id);
        const releaseNotes = release.body.split('\n');
        const isPreview = index > 0 && !release.prerelease;
        const isLatest = index === 0 && !release.prerelease;

        return (
          <div key={release.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Release Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{release.tagName}</h3>
                  {release.prerelease && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      Pre-release
                    </span>
                  )}
                  {isLatest && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Latest
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{release.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(release.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setShareModalRelease(release)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Share with clients"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleExpanded(release.id)}
                  className={`p-2 text-gray-600 hover:text-gray-900 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Release Notes (expandable) */}
            {isExpanded && (
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {release.body || 'No release notes'}
                </p>
              </div>
            )}

            {/* Assets */}
            {release.assets.length > 0 && (
              <div className="px-6 py-4 space-y-2">
                {release.assets.map((asset) => (
                  <div key={asset.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <span className="text-base flex-shrink-0">📦</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(asset.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Share Release Modal */}
      <ShareReleaseModal
        isOpen={!!shareModalRelease}
        onClose={() => setShareModalRelease(null)}
        release={shareModalRelease}
        onSuccess={fetchReleases}
      />
    </div>
  );
};

export { ReleasesTab };

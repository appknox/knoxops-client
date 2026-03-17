import { apiClient } from './client';

export interface ReleaseAsset {
  id: number;
  name: string;
  size: number;
  contentType: string;
}

export interface GitHubRelease {
  id: number;
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
  draft: boolean;
  prerelease: boolean;
  assets: ReleaseAsset[];
  zipballUrl: string;
}

export const releasesApi = {
  list: async (): Promise<{ data: GitHubRelease[] }> => {
    try {
      const response = await apiClient.get('/releases');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 503) {
        throw new Error('Releases not configured. Please configure GitHub credentials.');
      }
      throw error;
    }
  },

  share: async (
    releaseId: number,
    body: {
      deploymentId: string;
      assetType: 'zipball' | 'asset';
      assetId?: number;
      assetName: string;
    }
  ): Promise<{ message: string }> => {
    const response = await apiClient.post(`/releases/${releaseId}/share`, body);
    return response.data;
  },

  shareWithClients: async (
    releaseId: number,
    clientIds: string[]
  ): Promise<{ success: boolean; message: string; sharedCount: number }> => {
    const response = await apiClient.post(`/releases/${releaseId}/share`, {
      clientIds,
    });
    return response.data;
  },
};

async function triggerDownload(url: string, filename: string): Promise<void> {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

export async function downloadReleaseAsset(
  releaseId: number,
  assetId: number,
  filename: string
): Promise<void> {
  await triggerDownload(`/api/releases/${releaseId}/assets/${assetId}/download`, filename);
}

export async function downloadReleaseZipball(
  releaseId: number,
  tagName: string
): Promise<void> {
  await triggerDownload(`/api/releases/${releaseId}/zipball`, `${tagName}-source.zip`);
}

import { apiClient } from './client';

export interface UpcomingPatch {
  id: string;
  clientName: string;
  nextScheduledPatchDate: string;
  daysUntilPatch: number;
  currentVersion: string | null;
  environmentType: string;
}

export interface PreviewResponse {
  upcomingPatches: UpcomingPatch[];
  count: number;
}

export interface TriggerResponse {
  message: string;
  upcomingPatchesCount: number;
}

export const notificationsApi = {
  previewPatchReminders: async (daysAhead = 10): Promise<PreviewResponse> => {
    const response = await apiClient.get<PreviewResponse>('/notifications/patch-reminders/preview', {
      params: { daysAhead },
    });
    return response.data;
  },

  triggerPatchReminders: async (deploymentIds: string[]): Promise<TriggerResponse> => {
    const response = await apiClient.post<TriggerResponse>('/notifications/patch-reminders/trigger', { deploymentIds });
    return response.data;
  },

  triggerDeploymentNotification: async (deploymentId: string): Promise<{ message: string; deploymentId: string }> => {
    const response = await apiClient.post<{ message: string; deploymentId: string }>(
      `/notifications/patch-reminders/trigger/${deploymentId}`
    );
    return response.data;
  },
};

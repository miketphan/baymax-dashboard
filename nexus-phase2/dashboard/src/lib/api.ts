const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8787';

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'done' | 'archived';
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  status?: 'backlog' | 'in_progress' | 'done' | 'archived';
  priority?: 'high' | 'medium' | 'low';
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: 'backlog' | 'in_progress' | 'done' | 'archived';
  priority?: 'high' | 'medium' | 'low';
}

export interface Service {
  id: string;
  name: string;
  display_name: string;
  status: 'online' | 'attention' | 'offline';
  last_check?: string;
  next_check?: string;
  check_interval_minutes: number;
  details?: Record<string, unknown>;
}

export interface UsageData {
  id: string;
  category: string;
  display_name: string;
  current_value: number;
  limit_value: number;
  period: 'session' | 'daily' | 'weekly' | 'monthly';
  unit: string;
  progress_percent: number;
  status: 'normal' | 'warning' | 'danger';
  last_updated?: string;
}

export interface SyncState {
  sections: Array<{
    section: string;
    status: 'fresh' | 'stale' | 'error';
    last_sync: string | null;
    stale_after_minutes: number;
    stale: boolean;
    error?: string;
  }>;
  overall_status: 'fresh' | 'stale' | 'error';
  timestamp: string;
}

export interface SyncResult {
  success: boolean;
  duration_ms?: number;
  results?: Record<string, unknown>;
  errors?: string[];
  error?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'baymax_alert' | 'system' | 'project_update';
  title: string;
  message?: string;
  source_id?: string;
  source_type?: string;
  status: 'unread' | 'read' | 'acknowledged';
  created_at: string;
  read_at?: string;
}

export interface ProjectActivityLog {
  id: number;
  project_id: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'priority_changed';
  field?: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

class ApiClient {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.fetch<Project[]>('/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.fetch<Project>(`/projects/${id}`);
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    return this.fetch<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    return this.fetch<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patchProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    return this.fetch<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.fetch(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Services
  async getServices(): Promise<Service[]> {
    return this.fetch<Service[]>('/services');
  }

  async connectService(type: string, config: Record<string, unknown>): Promise<Service> {
    return this.fetch<Service>('/services/connect', {
      method: 'POST',
      body: JSON.stringify({ type, config }),
    });
  }

  async disconnectService(id: string): Promise<void> {
    return this.fetch(`/services/${id}/disconnect`, {
      method: 'POST',
    });
  }

  // Usage
  async getUsage(): Promise<UsageData[]> {
    const response = await this.fetch<{ data: { metrics: UsageData[] } }>('/usage');
    return response.data.metrics;
  }

  // Sync
  async getSyncStatus(): Promise<SyncState> {
    const response = await this.fetch<{ data: SyncState }>('/sync');
    return response.data;
  }

  async triggerUniversalSync(): Promise<SyncResult> {
    const response = await this.fetch<{ data: SyncResult }>('/sync', {
      method: 'POST',
    });
    return response.data;
  }

  async getSyncSectionContent(section: string): Promise<{ content: string; last_sync?: string }> {
    const response = await this.fetch<{ data: { content: string; last_sync?: string } }>(`/sync/${section}`);
    return response.data;
  }

  async syncProjects(content?: string): Promise<unknown> {
    const response = await this.fetch<{ data: unknown }>('/sync/projects', {
      method: 'POST',
      body: content ? JSON.stringify({ content }) : undefined,
    });
    return response.data;
  }

  // Notifications / Baymax
  async triggerBaymaxAlert(data: {
    title: string;
    message?: string;
    source_id?: string;
    source_type?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await this.fetch<{ data: { success: boolean; message: string } }>('/notify', {
      method: 'POST',
      body: JSON.stringify({
        type: 'baymax_alert',
        ...data,
      }),
    });
    return response.data;
  }

  async getNotifications(unreadOnly?: boolean): Promise<Notification[]> {
    const query = unreadOnly ? '?unread=true' : '';
    const response = await this.fetch<{ data: { notifications: Notification[] } }>(`/notifications${query}`);
    return response.data.notifications;
  }

  async getNotificationCount(): Promise<{ total: number; unread: number }> {
    const response = await this.fetch<{ data: { count: { total: number; unread: number } } }>('/notifications/count');
    return response.data.count;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.fetch(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.fetch('/notifications/read-all', { method: 'POST' });
  }

  // Sync Health / Staleness
  async getSyncHealth(): Promise<{
    sections: Array<{
      section: string;
      isStale: boolean;
      lastSync: string | null;
      staleAfterMinutes: number;
      minutesSinceSync: number | null;
      display: {
        text: string;
        color: string;
        icon: string;
        shouldRefresh: boolean;
      };
    }>;
    overall_status: 'fresh' | 'stale' | 'error';
    timestamp: string;
  }> {
    const response = await this.fetch<{
      data: {
        sections: Array<{
          section: string;
          isStale: boolean;
          lastSync: string | null;
          staleAfterMinutes: number;
          minutesSinceSync: number | null;
          display: {
            text: string;
            color: string;
            icon: string;
            shouldRefresh: boolean;
          };
        }>;
        overall_status: 'fresh' | 'stale' | 'error';
        timestamp: string;
      };
    }>('/sync/health');
    return response.data;
  }

  async getSectionHealth(section: string): Promise<{
    section: string;
    isStale: boolean;
    lastSync: string | null;
    staleAfterMinutes: number;
    minutesSinceSync: number | null;
    display: {
      text: string;
      color: string;
      icon: string;
      shouldRefresh: boolean;
    };
    message: string;
    timestamp: string;
  }> {
    const response = await this.fetch<{
      data: {
        section: string;
        isStale: boolean;
        lastSync: string | null;
        staleAfterMinutes: number;
        minutesSinceSync: number | null;
        display: {
          text: string;
          color: string;
          icon: string;
          shouldRefresh: boolean;
        };
        message: string;
        timestamp: string;
      };
    }>(`/sync/health/${section}`);
    return response.data;
  }
}

export const api = new ApiClient();

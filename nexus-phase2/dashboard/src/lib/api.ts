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
}

export const api = new ApiClient();

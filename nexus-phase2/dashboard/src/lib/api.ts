const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'done' | 'archived';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  status?: 'backlog' | 'in_progress' | 'done' | 'archived';
  priority?: 'high' | 'medium' | 'low';
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'backlog' | 'in_progress' | 'done' | 'archived';
  priority?: 'high' | 'medium' | 'low';
}

export interface Service {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  config?: Record<string, unknown>;
}

export interface UsageData {
  resource: string;
  limit: number;
  used: number;
  unit: string;
  period: string;
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
    return this.fetch<UsageData[]>('/usage');
  }
}

export const api = new ApiClient();

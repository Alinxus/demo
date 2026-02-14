// Copy the SDK inline since we're in a separate Next.js app
interface WhisperConfig {
  apiKey: string;
  baseUrl?: string;
}

class WhisperContext {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: WhisperConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'http://localhost:4000';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whisper API error: ${error}`);
    }

    return response.json();
  }

  async listProjects() {
    return this.request<{ projects: any[] }>('/v1/projects', { method: 'GET' });
  }

  async createProject(params: { name: string; description?: string }) {
    return this.request<any>('/v1/projects', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async ingest(projectId: string, documents: any[]) {
    return this.request<{ ingested: number }>(`/v1/projects/${projectId}/ingest`, {
      method: 'POST',
      body: JSON.stringify({ documents }),
    });
  }

  async query(params: {
    project: string;
    query: string;
    top_k?: number;
    hybrid?: boolean;
    metadata_filter?: Record<string, any>;
  }) {
    return this.request<any>('/v1/context/query', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export const whisperClient = new WhisperContext({
  apiKey: process.env.WHISPER_API_KEY || '',
  baseUrl: process.env.WHISPER_API_BASE_URL || 'http://localhost:4000',
});

export const PROJECT_NAME = 'decide-demo-enterprise';

export async function getOrCreateProject() {
  try {
    const projects = await whisperClient.listProjects();
    const existing = projects.projects.find((p: any) => p.name === PROJECT_NAME);

    if (existing) {
      return existing.id;
    }

    const project = await whisperClient.createProject({
      name: PROJECT_NAME,
      description: 'Enterprise demo for Decide.ai - Memory layer for Excel agents',
    });

    return project.id;
  } catch (error) {
    console.error('Failed to get/create project:', error);
    throw error;
  }
}

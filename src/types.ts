export interface ArtificialAnalysisModel {
  id: string;
  name: string;
  slug: string;
  model_creator: {
    id: string;
    name: string;
    slug: string;
  };
  context_window?: number;
  max_tokens?: number;
  pricing?: {
    input: number;
    output: number;
  };
  evaluations?: Record<string, number>;
}

export interface ModelInfo {
  name: string;
  contextWindow: number;
  slug: string;
  creator: string;
}

export interface CachedModel {
  contextWindow: number;
  lastUpdated: string;
}

export interface ApiResponse {
  success: boolean;
  data?: ModelInfo;
  error?: string;
}

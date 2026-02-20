import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface Investment {
  id: string
  name: string
  category: 'land' | 'stocks' | 'gold' | 'crypto' | 'real_estate' | 'bonds' | 'other'
  description?: string
  address?: string
  city?: string
  state?: string
  country: string
  purchase_price?: number
  purchase_date?: string
  current_value?: number
  last_valuation_date?: string
  land_area_hectares?: number
  zoning_type?: string
  ownership_percentage?: number
  status: 'active' | 'sold' | 'pending' | 'under_contract'
  tags: string[]
  created_at: string
  updated_at: string
  document_count?: number
  file_count?: number
  return_percentage?: number
}

export interface FileItem {
  id: string
  original_filename: string
  storage_key: string
  file_size_bytes?: number
  mime_type?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  uploaded_at: string
  investment_id?: string
  tags: string[]
}

export interface AnalysisResult {
  id: string
  analysis_type: string
  confidence_score?: number
  summary?: string
  raw_text?: string
  created_at: string
}

export interface AnalysisJob {
  id: string
  filename?: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  job_type: string
  retry_count: number
  created_at: string
  error_message?: string
}

export interface DashboardStats {
  total_investments: number
  total_value: number
  total_invested?: number
  total_return?: number
  total_return_pct?: number
  total_files: number
  pending_analyses: number
  completed_analyses: number
  investments_by_category: Record<string, number>
  recent_uploads: FileItem[]
  recent_analyses: AnalysisResult[]
}

// API Functions
export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats').then(r => r.data),
  getCategoryBreakdown: () => api.get('/dashboard/category-breakdown').then(r => r.data),
}

export const investmentsApi = {
  list: () => api.get<Investment[]>('/investments').then(r => r.data),
  get: (id: string) => api.get<Investment>(`/investments/${id}`).then(r => r.data),
  create: (data: Partial<Investment>) => api.post<Investment>('/investments', data).then(r => r.data),
  update: (id: string, data: Partial<Investment>) => api.put<Investment>(`/investments/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/investments/${id}`),
}

export const filesApi = {
  list: () => api.get<FileItem[]>('/files').then(r => r.data),
  get: (id: string) => api.get<FileItem>(`/files/${id}`).then(r => r.data),
  getDownloadUrl: (id: string) => api.get(`/files/${id}/download-url`).then(r => r.data),
  delete: (id: string) => api.delete(`/files/${id}`),
}

export const uploadsApi = {
  requestUrl: (data: { filename: string; content_type: string; investment_id?: string; source_device?: string }) =>
    api.post('/uploads/request-url', data).then(r => r.data),
  confirm: (data: { file_id: string; investment_id?: string; document_type?: string; request_analysis?: boolean }) =>
    api.post('/uploads/confirm', data).then(r => r.data),
}

export const analysisApi = {
  listResults: () => api.get<AnalysisResult[]>('/analysis/results').then(r => r.data),
  listJobs: () => api.get<AnalysisJob[]>('/analysis/jobs').then(r => r.data),
  getQueueStats: () => api.get<{ total: number; by_status: Record<string, number> }>('/analysis/queue/stats').then(r => r.data),
}

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  attachments?: Array<{
    id: string
    type: 'investment' | 'file'
    name: string
    data: unknown
  }>
}

export interface ChatRequest {
  messages: ChatMessage[]
  investment_id?: string
  file_ids?: string[]
  stream?: boolean
  model?: string
  api_key?: string
}

export interface ChatResponse {
  message: ChatMessage
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
}

// Analytics Types
export interface InvestmentMetrics {
  investment_id: string
  name: string
  category: string
  basic: {
    total_invested: number
    current_value: number
    absolute_return: number
    simple_roi: number
  }
  time_weighted: {
    annualized_roi: number | null
    cagr: number | null
    years_held: number
  }
  advanced: {
    irr: number | null
    npv: number | null
    payback_period_months: number | null
  }
  risk: {
    sharpe_ratio: number | null
    volatility: number | null
    max_drawdown: number | null
    var_95: number | null
  }
  comparative: {
    vs_inflation: number | null
    vs_cdi: number | null
    vs_sp500: number | null
  }
}

export interface PortfolioSummary {
  summary: {
    total_value: number
    total_invested: number
    total_absolute_return: number
    total_roi: number
    weighted_cagr: number | null
  }
  risk: {
    portfolio_volatility: number | null
    portfolio_sharpe: number | null
  }
  allocation: Record<string, number>
  best_performer: { id: string; name: string; roi: number } | null
  worst_performer: { id: string; name: string; roi: number } | null
  investment_count: number
  investments: InvestmentMetrics[]
}

export interface ComparisonResult {
  winner: {
    id: string
    name: string
    score: number
  }
  rankings: Array<{
    investment_id: string
    name: string
    category: string
    metrics: Record<string, number | null>
    scores: {
      composite: number
      risk_adjusted: number | null
    }
    rankings: {
      composite: number
      roi: number
      cagr: number
      sharpe: number
    }
  }>
  portfolio_summary: {
    total_value: number
    total_invested: number
    total_return_pct: number
    avg_roi: number
    avg_cagr: number
  }
  risk_analysis: {
    concentration: Record<string, number>
    distribution: Record<string, number>
  }
  recommendations: string[]
  warnings: string[]
  opportunities: string[]
}

export interface ScenarioResult {
  scenario: string
  impact_pct: number
  portfolio_impact: number
  total_current: number
  total_projected: number
  projections: Array<{
    investment_id: string
    name: string
    category: string
    current_value: number
    projected_value: number
    value_change: number
    current_roi: number
    projected_roi: number
  }>
}

// Analytics API
export const analyticsApi = {
  getInvestmentMetrics: (id: string) =>
    api.get<{ success: boolean; data: InvestmentMetrics }>(`/analytics/investments/${id}/metrics`).then(r => r.data),

  getBatchMetrics: (ids: string[]) =>
    api.post<{ success: boolean; count: number; data: InvestmentMetrics[] }>('/analytics/investments/batch-metrics', ids).then(r => r.data),

  getPortfolioSummary: (params?: { category?: string; status?: string }) =>
    api.get<{ success: boolean; data: PortfolioSummary }>('/analytics/portfolio/summary', { params }).then(r => r.data),

  getPortfolioOptimization: () =>
    api.get<{ success: boolean; data: unknown; error?: string }>('/analytics/portfolio/optimization').then(r => r.data),

  compareInvestments: (ids: string[], riskProfile: string = 'balanced', includeScenarios: boolean = true) =>
    api.post<{ success: boolean; data: ComparisonResult }>('/analytics/compare', ids, {
      params: { risk_profile: riskProfile, include_scenarios: includeScenarios }
    }).then(r => r.data),

  compareAll: (params?: { category?: string; limit?: number }) =>
    api.get<{ success: boolean; data: ComparisonResult }>('/analytics/compare/all', { params }).then(r => r.data),

  runScenarioAnalysis: (ids: string[], scenarioType: string = 'market_crash', customImpact?: number) =>
    api.post<{ success: boolean; data: ScenarioResult }>('/analytics/scenario-analysis', ids, {
      params: { scenario_type: scenarioType, custom_impact: customImpact }
    }).then(r => r.data),

  getBenchmarks: () =>
    api.get<{ success: boolean; data: { rates: Record<string, string>; values: Record<string, number>; description: Record<string, string> } }>('/analytics/benchmarks').then(r => r.data),
}

// Chat API
export const chatApi = {
  sendMessage: (data: ChatRequest) =>
    api.post<ChatResponse>('/chat', data).then(r => r.data),

  sendMessageStream: async (data: Omit<ChatRequest, 'stream'>): Promise<ReadableStreamDefaultReader<string>> => {
    const response = await fetch(`${API_URL}/api/v1/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, stream: true }),
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    // Create a reader that yields strings
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body')
    }

    // Return a custom async iterator
    return {
      async read(): Promise<{ done: boolean; value: string }> {
        const result = await reader.read()
        if (result.done) {
          return { done: true, value: '' }
        }
        return { done: false, value: decoder.decode(result.value, { stream: true }) }
      },
      releaseLock: () => reader.releaseLock(),
      cancel: (reason?: unknown) => reader.cancel(reason),
      closed: reader.closed,
    } as ReadableStreamDefaultReader<string>
  },

  getInvestmentsForContext: () =>
    api.get<Array<{
      id: string
      name: string
      category: string
      city?: string
      status?: string
    }>>('/chat/context/investments').then(r => r.data),

  getFilesForContext: (investment_id?: string) =>
    api.get<Array<{
      id: string
      filename: string
      mime_type?: string
      size_bytes?: number
      status?: string
      investment_id?: string
    }>>('/chat/context/files', { params: investment_id ? { investment_id } : undefined }).then(r => r.data),
}

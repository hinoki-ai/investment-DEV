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

export interface DashboardStats {
  total_investments: number
  total_value: number
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
  listJobs: () => api.get('/analysis/jobs').then(r => r.data),
  getQueueStats: () => api.get('/analysis/queue/stats').then(r => r.data),
}

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  MapPin, 
  Upload,
  Trash2,
  Edit,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Tag,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { investmentsApi, uploadsApi } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'

const categoryIcons: Record<string, string> = {
  land: '🏞️',
  stocks: '📈',
  gold: '🪙',
  crypto: '₿',
  real_estate: '🏢',
  bonds: '📜',
  other: '📦'
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { 
    label: 'Active', 
    className: 'bg-success-dim text-success border-success/20' 
  },
  sold: { 
    label: 'Sold', 
    className: 'bg-surface text-text-muted border-border' 
  },
  pending: { 
    label: 'Pending', 
    className: 'bg-warning-dim text-warning border-warning/20' 
  },
  under_contract: { 
    label: 'Under Contract', 
    className: 'bg-info-dim text-info border-info/20' 
  },
}

export default function InvestmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isUploading, setIsUploading] = useState(false)

  const { data: investment, isLoading } = useQuery({
    queryKey: ['investment', id],
    queryFn: () => investmentsApi.get(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => investmentsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      navigate('/investments')
    },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return

    setIsUploading(true)
    try {
      const { upload_url, file_id } = await uploadsApi.requestUrl({
        filename: file.name,
        content_type: file.type,
        investment_id: id,
        source_device: 'web',
      })

      const response = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!response.ok) throw new Error('Upload failed')

      await uploadsApi.confirm({
        file_id,
        investment_id: id,
        document_type: 'other',
        request_analysis: true,
      })

      queryClient.invalidateQueries({ queryKey: ['investment', id] })
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="h-8 w-48 bg-surface rounded-lg animate-pulse" />
        <div className="h-64 bg-surface rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!investment) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Investment not found</p>
      </div>
    )
  }

  const returnPositive = (investment.return_percentage || 0) >= 0
  const status = statusConfig[investment.status] || statusConfig.active

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => navigate('/investments')}
            className="p-2 rounded-xl bg-surface border border-border hover:border-border-strong transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-text-secondary" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <span className="text-2xl">{categoryIcons[investment.category] || '📦'}</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                {investment.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border ${status.className}`}>
                {status.label}
              </span>
              {investment.city && (
                <span className="flex items-center gap-1 text-sm text-text-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  {investment.city}{investment.state ? `, ${investment.state}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="glyph-btn glyph-btn-ghost">
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to delete this investment?')) {
                deleteMutation.mutate()
              }
            }}
            className="glyph-btn border-error/30 text-error hover:bg-error-dim"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Overview */}
          <section className="glass-card-elevated">
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-cream-muted" />
                <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Financial Overview</span>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Purchase Price</p>
                  <p className="font-mono text-xl font-semibold text-text-primary">
                    {investment.purchase_price 
                      ? formatCurrency(investment.purchase_price)
                      : '—'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Current Value</p>
                  <p className="font-mono text-xl font-semibold text-cream">
                    {investment.current_value 
                      ? formatCurrency(investment.current_value)
                      : '—'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Return</p>
                  <p className={`font-mono text-xl font-semibold flex items-center gap-1 ${
                    returnPositive ? 'text-success' : 'text-error'
                  }`}>
                    {returnPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {investment.return_percentage !== undefined
                      ? `${returnPositive ? '+' : ''}${investment.return_percentage.toFixed(1)}%`
                      : '—'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Documents</p>
                  <p className="font-mono text-xl font-semibold text-text-primary">
                    {investment.document_count || 0}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Description */}
          {investment.description && (
            <section className="glass-card">
              <div className="p-5">
                <h2 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-3">Description</h2>
                <p className="text-sm text-text-secondary leading-relaxed">{investment.description}</p>
              </div>
            </section>
          )}

          {/* Land Specific */}
          {investment.category === 'land' && (
            <section className="glass-card-elevated">
              <div className="p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏞️</span>
                  <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Land Details</span>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Area</p>
                    <p className="font-mono text-lg font-semibold text-text-primary">
                      {investment.land_area_hectares 
                        ? `${investment.land_area_hectares} ha`
                        : '—'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Zoning</p>
                    <p className="font-mono text-lg font-semibold text-text-primary capitalize">
                      {investment.zoning_type || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Ownership</p>
                    <p className="font-mono text-lg font-semibold text-text-primary">
                      {investment.ownership_percentage}%
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Documents List */}
          {investment.documents && investment.documents.length > 0 && (
            <section className="glass-card-elevated">
              <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cream-muted" />
                    <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Documents</span>
                  </div>
                  <span className="text-xs text-text-muted">{investment.documents.length} files</span>
                </div>
              </div>
              <div className="p-2">
                <div className="space-y-1">
                  {investment.documents.map((doc: any) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-surface transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-surface-elevated">
                          <FileText className="h-4 w-4 text-text-muted" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{doc.filename}</p>
                          <p className="text-xs text-text-muted capitalize">{doc.document_type}</p>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upload Card */}
          <section className="relative overflow-hidden rounded-2xl border border-cream/20 bg-gradient-to-br from-cream/10 to-surface p-5">
            <div className="absolute inset-0 glyph-pattern opacity-5" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="h-4 w-4 text-cream" />
                <h3 className="font-semibold text-cream">Upload Documents</h3>
              </div>
              <p className="text-xs text-cream-muted mb-4">
                Upload deeds, contracts, photos, or any related files. AI analysis will start automatically.
              </p>
              <label className="glyph-btn glyph-btn-primary w-full flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Choose File'}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </section>

          {/* Key Info */}
          <section className="glass-card">
            <div className="p-5 border-b border-border">
              <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Key Information</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-text-muted">
                  <Tag className="h-4 w-4" />
                  Status
                </span>
                <span className="text-sm font-medium text-text-primary capitalize">{investment.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-text-muted">
                  <Calendar className="h-4 w-4" />
                  Purchase Date
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {investment.purchase_date ? formatDate(investment.purchase_date) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-text-muted">
                  <Calendar className="h-4 w-4" />
                  Last Updated
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {formatDate(investment.updated_at)}
                </span>
              </div>
            </div>
            
            {investment.tags?.length > 0 && (
              <>
                <div className="border-t border-border mx-5" />
                <div className="p-5">
                  <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase block mb-3">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {investment.tags.map((tag: string) => (
                      <span 
                        key={tag}
                        className="text-xs px-2.5 py-1 bg-surface text-text-secondary rounded-full border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Quick Actions */}
          <section className="glass-card">
            <div className="p-5 border-b border-border">
              <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Quick Actions</span>
            </div>
            <div className="p-2">
              <Link 
                to="/land-analyzer"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-surface transition-colors group"
              >
                <span className="text-sm text-text-secondary group-hover:text-text-primary">Land Credit Analysis</span>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </Link>
              <Link 
                to="/analysis"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-surface transition-colors group"
              >
                <span className="text-sm text-text-secondary group-hover:text-text-primary">View AI Analysis</span>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

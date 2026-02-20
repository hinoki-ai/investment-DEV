import { useState, useRef, useMemo } from 'react'
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
  ExternalLink,
  Calculator,
  Building2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { investmentsApi, uploadsApi } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'
import { 
  SAMPLE_CREDITS,
  CreditScenario,
  LandOpportunity,
  analyzeLandCreditCombo,
  formatPercent,
  CURRENT_UF_VALUE
} from '../lib/landCredit'
import { 
  CreditTruthRevealer,
  AmortizationChart,
  PaymentBreakdownChart
} from '../components/CreditAnalysis'
import { HelpTooltip, INVESTMENT_TOOLTIPS } from '../components/HelpTooltip'

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
    label: 'Activo', 
    className: 'bg-success-dim text-success border-success/20' 
  },
  sold: { 
    label: 'Vendido', 
    className: 'bg-surface text-text-muted border-border' 
  },
  pending: { 
    label: 'Pendiente', 
    className: 'bg-warning-dim text-warning border-warning/20' 
  },
  under_contract: { 
    label: 'En Contrato', 
    className: 'bg-info-dim text-info border-info/20' 
  },
}

export default function InvestmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const processFile = async (file: File) => {
    if (!id) return

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
      alert('Error al subir. Intenta nuevamente.')
    } finally {
      setIsUploading(false)
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await processFile(file)
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
        <p className="text-text-muted">Inversión no encontrada</p>
      </div>
    )
  }

  const returnPositive = (investment.return_percentage || 0) >= 0
  const status = statusConfig[investment.status] || statusConfig.active

  // Credit Analysis State (for land investments)
  const [selectedCredit, setSelectedCredit] = useState<CreditScenario>(SAMPLE_CREDITS[0])
  
  // Build land opportunity from investment data
  const landOpportunity: LandOpportunity | null = useMemo(() => {
    if (investment.category !== 'land') return null
    return {
      id: investment.id,
      name: investment.name,
      location: {
        region: investment.state || 'Unknown',
        city: investment.city || 'Unknown',
        commune: investment.city || 'Unknown'
      },
      askingPrice: investment.purchase_price || investment.current_value || 0,
      landAreaSquareMeters: (investment.land_area_hectares || 0) * 10000,
      pricePerSquareMeter: investment.purchase_price && investment.land_area_hectares 
        ? investment.purchase_price / (investment.land_area_hectares * 10000)
        : 0,
      appraisalValue: investment.current_value || investment.purchase_price || 0,
      belowAppraisalBy: investment.purchase_price && investment.current_value
        ? ((investment.current_value - investment.purchase_price) / investment.current_value) * 100
        : 0,
      zoning: (investment.zoning_type as any) || 'residential',
      hasBasicServices: true,
      hasRoadAccess: true,
      topography: 'flat',
      expectedAppreciationAnnual: 5,
      status: 'available',
      listingDate: investment.purchase_date || new Date().toISOString(),
      notes: investment.description || ''
    }
  }, [investment])

  // Calculate analysis when we have land data
  const creditAnalysis = useMemo(() => {
    if (!landOpportunity || !selectedCredit) return null
    return analyzeLandCreditCombo(landOpportunity, selectedCredit)
  }, [landOpportunity, selectedCredit])

  // Get applicable credits based on land price
  const applicableCredits = useMemo(() => {
    if (!landOpportunity) return []
    return SAMPLE_CREDITS.filter(c => c.effectiveCreditAmount <= (landOpportunity.askingPrice * 0.9))
  }, [landOpportunity])

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
            Editar
          </button>
          <button 
            onClick={() => {
              if (confirm('¿Estás seguro de eliminar esta inversión?')) {
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Financial Overview */}
          <section className="glass-card-elevated">
            <div className="p-4 sm:p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-cream-muted" />
                <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Resumen Financiero</span>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                    Precio de Compra
                    <HelpTooltip title="Purchase Price" content={INVESTMENT_TOOLTIPS.purchasePrice.content} example={INVESTMENT_TOOLTIPS.purchasePrice.example} size="sm" />
                  </p>
                  <p className="font-mono text-lg sm:text-xl font-semibold text-text-primary break-all">
                    {investment.purchase_price 
                      ? formatCurrency(investment.purchase_price)
                      : '—'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                    Valor Actual
                    <HelpTooltip title="Current Value" content={INVESTMENT_TOOLTIPS.currentValue.content} example={INVESTMENT_TOOLTIPS.currentValue.example} size="sm" />
                  </p>
                  <p className="font-mono text-lg sm:text-xl font-semibold text-cream break-all">
                    {investment.current_value 
                      ? formatCurrency(investment.current_value)
                      : '—'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                    Retorno
                    <HelpTooltip title="Return %" content={INVESTMENT_TOOLTIPS.returnPercentage.content} example={INVESTMENT_TOOLTIPS.returnPercentage.example} size="sm" />
                  </p>
                  <p className={`font-mono text-lg sm:text-xl font-semibold flex items-center gap-1 ${
                    returnPositive ? 'text-success' : 'text-error'
                  }`}>
                    {returnPositive ? <TrendingUp className="h-4 w-4 flex-shrink-0" /> : <TrendingDown className="h-4 w-4 flex-shrink-0" />}
                    {investment.return_percentage !== undefined
                      ? `${returnPositive ? '+' : ''}${investment.return_percentage.toFixed(1)}%`
                      : '—'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Documentos</p>
                  <p className="font-mono text-lg sm:text-xl font-semibold text-text-primary">
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
                <h2 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-3">Descripción</h2>
                <p className="text-sm text-text-secondary leading-relaxed">{investment.description}</p>
              </div>
            </section>
          )}

          {/* Land Specific with Credit Analysis */}
          {investment.category === 'land' && landOpportunity && (
            <>
              {/* Land Details */}
              <section className="glass-card-elevated">
                <div className="p-4 sm:p-5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏞️</span>
                    <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Detalles del Terreno</span>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Área</p>
                      <p className="font-mono text-base sm:text-lg font-semibold text-text-primary">
                        {investment.land_area_hectares 
                          ? `${investment.land_area_hectares} ha`
                          : '—'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Zonificación</p>
                      <p className="font-mono text-base sm:text-lg font-semibold text-text-primary capitalize">
                        {investment.zoning_type || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Propiedad</p>
                      <p className="font-mono text-base sm:text-lg font-semibold text-text-primary">
                        {investment.ownership_percentage}%
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Credit Analysis Section */}
              <section className="glass-card-elevated border border-cream/10">
                <div className="p-4 sm:p-5 border-b border-border">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-cream" />
                      <span className="text-sm font-semibold tracking-widest text-cream uppercase">Análisis de Crédito</span>
                    </div>
                    <span className="text-xs text-text-muted">Valor UF: {formatCurrency(CURRENT_UF_VALUE)}</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-6">
                  {/* Warning Banner */}
                  <div className="rounded-xl border border-warning/20 bg-warning-dim p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-warning font-medium">Análisis Real del Costo del Crédito</p>
                        <p className="text-xs text-text-secondary mt-1">
                          Los bancos anuncian montos que realmente no recibes. Selecciona un escenario de crédito para ver el 
                          <strong> costo real</strong> y los <strong>pagos mensuales</strong> para este terreno.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Credit Selector */}
                  <div>
                    <h4 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Seleccionar Escenario de Crédito
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {applicableCredits.length > 0 ? (
                        applicableCredits.map((credit) => (
                          <button
                            key={credit.id}
                            onClick={() => setSelectedCredit(credit)}
                            className={`
                              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                              ${selectedCredit.id === credit.id
                                ? 'bg-cream text-void'
                                : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-strong'
                              }
                            `}
                          >
                            <div className="flex flex-col items-start">
                              <span>{credit.bank}</span>
                              <span className="text-[10px] opacity-70">
                                {credit.annualInterestRate}% • {credit.termYears} yrs
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        SAMPLE_CREDITS.slice(0, 3).map((credit) => (
                          <button
                            key={credit.id}
                            onClick={() => setSelectedCredit(credit)}
                            className={`
                              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                              ${selectedCredit.id === credit.id
                                ? 'bg-cream text-void'
                                : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-strong'
                              }
                            `}
                          >
                            <div className="flex flex-col items-start">
                              <span>{credit.bank}</span>
                              <span className="text-[10px] opacity-70">
                                {credit.annualInterestRate}% • {credit.termYears} yrs
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  {creditAnalysis && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Pago Mensual</p>
                        <p className="font-mono text-lg font-semibold text-info">
                          {formatCurrency(creditAnalysis.monthlyPayment)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Efectivo Requerido</p>
                        <p className="font-mono text-lg font-semibold text-warning">
                          {formatCurrency(creditAnalysis.cashRequired)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">ROI 5 Años</p>
                        <p className={`font-mono text-lg font-semibold ${creditAnalysis.roi5Year > 0 ? 'text-success' : 'text-error'}`}>
                          {creditAnalysis.roi5Year > 0 ? '+' : ''}{formatPercent(creditAnalysis.roi5Year)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-surface p-4">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Puntaje</p>
                        <div className="flex items-center gap-2">
                          <p className={`font-mono text-lg font-semibold ${
                            creditAnalysis.score >= 70 ? 'text-success' : 
                            creditAnalysis.score >= 50 ? 'text-cream' : 'text-warning'
                          }`}>
                            {creditAnalysis.score}
                          </p>
                          {creditAnalysis.score >= 70 && (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AmortizationChart credit={selectedCredit} />
                    <PaymentBreakdownChart credit={selectedCredit} />
                  </div>

                  {/* Detailed Credit Truth */}
                  <CreditTruthRevealer credit={selectedCredit} />
                </div>
              </section>
            </>
          )}

          {/* Documents List */}
          {(investment as any).documents && (investment as any).documents.length > 0 && (
            <section className="glass-card-elevated">
              <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cream-muted" />
                    <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Documentos</span>
                  </div>
                  <span className="text-xs text-text-muted">{(investment as any).documents.length} archivos</span>
                </div>
              </div>
              <div className="p-2">
                <div className="space-y-1">
                  {(investment as any).documents.map((doc: any) => (
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
        <div className="space-y-4 sm:space-y-6">
          {/* Upload Card */}
          <section 
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-4 sm:p-5 transition-all duration-200 ${
              isDragging 
                ? 'border-cream bg-cream/10' 
                : 'border-cream/20 bg-gradient-to-br from-cream/10 to-surface'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="h-4 w-4 text-cream" />
                <h3 className="font-semibold text-cream text-sm sm:text-base">Subir Documentos</h3>
              </div>
              <p className="text-xs text-cream-muted mb-4">
                Arrastra archivos aquí o haz click para buscar. El análisis AI comienza automáticamente.
              </p>
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <label 
                htmlFor="file-upload"
                className={`glyph-btn glyph-btn-primary w-full flex items-center justify-center gap-2 py-3 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Subiendo...' : 'Elegir Archivo'}
              </label>
            </div>
          </section>

          {/* Key Info */}
          <section className="glass-card">
            <div className="p-4 sm:p-5 border-b border-border">
              <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Información Clave</span>
            </div>
            <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm text-text-muted">
                  <Tag className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Estado</span>
                </span>
                <span className="text-sm font-medium text-text-primary capitalize">{investment.status}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm text-text-muted">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Fecha de Compra</span>
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {investment.purchase_date ? formatDate(investment.purchase_date) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm text-text-muted">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Última Actualización</span>
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
                  <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase block mb-3">Etiquetas</span>
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
              <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Acciones Rápidas</span>
            </div>
            <div className="p-2">
              <Link 
                to="/land-analyzer"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-surface transition-colors group"
              >
                <span className="text-sm text-text-secondary group-hover:text-text-primary">Análisis de Crédito</span>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </Link>
              <Link 
                to="/analysis"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-surface transition-colors group"
              >
                <span className="text-sm text-text-secondary group-hover:text-text-primary">Ver Análisis AI</span>
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

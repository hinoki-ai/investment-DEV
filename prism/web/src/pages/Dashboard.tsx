import { useQuery } from '@tanstack/react-query'
import { 
  Trees, 
  DollarSign, 
  FileText, 
  Brain,
  TrendingUp,
  Clock,
  Activity,
  ChevronRight
} from 'lucide-react'
import StatCard, { FeaturedStat } from '../components/StatCard'
import { dashboardApi, investmentsApi } from '../lib/api'
import { formatCurrency, formatNumber } from '../lib/utils'
import { Link } from 'react-router-dom'

// Category icon mapping
const categoryIcons: Record<string, string> = {
  land: '🏞️',
  stocks: '📈',
  gold: '🪙',
  crypto: '₿',
  real_estate: '🏢',
  bonds: '📜',
  other: '📦'
}

// Category labels
const categoryLabels: Record<string, string> = {
  land: 'Terrenos',
  stocks: 'Acciones',
  gold: 'Oro',
  crypto: 'Crypto',
  real_estate: 'Inmuebles',
  bonds: 'Bonos',
  other: 'Otros'
}

// Skeleton loader component
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-surface-elevated rounded-lg" />
        <div className="h-4 w-72 bg-surface rounded-lg" />
      </div>
      
      {/* Featured stat skeleton */}
      <div className="h-48 bg-surface-elevated rounded-3xl" />
      
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-surface rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  })

  const { data: investments } = useQuery({
    queryKey: ['investments'],
    queryFn: investmentsApi.list,
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const totalValue = stats?.total_value || 0
  const totalInvestments = stats?.total_investments || 0
  const totalFiles = stats?.total_files || 0
  const completedAnalyses = stats?.completed_analyses || 0
  const pendingAnalyses = stats?.pending_analyses || 0

  return (
    <div className="space-y-8 fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-cream-muted" />
            <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Dashboard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
            Resumen del Portafolio
          </h1>
          <p className="text-text-secondary mt-1">
            Gestiona el portafolio de inversiones familiares
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>En vivo</span>
          <span className="text-border-strong">|</span>
          <span>{new Date().toLocaleDateString('es-CL', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Featured Total Value */}
      <FeaturedStat
        label="Valor Total del Portafolio"
        value={formatCurrency(totalValue)}
        sublabel="Valor combinado de todas las categorías de inversión"
        icon={DollarSign}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          title="Inversiones"
          value={formatNumber(totalInvestments)}
          description="Activos monitoreados"
          icon={Trees}
          variant="default"
          delay={0}
        />
        <StatCard
          title="Archivos"
          value={formatNumber(totalFiles)}
          description="Documentos y media"
          icon={FileText}
          variant="default"
          delay={50}
        />
        <StatCard
          title="Análisis AI"
          value={formatNumber(completedAnalyses)}
          description={`${pendingAnalyses} pendientes`}
          icon={Brain}
          variant="accent"
          delay={100}
        />
        <StatCard
          title="Categorías"
          value={Object.keys(stats?.investments_by_category || {}).length}
          description="Diversificación de activos"
          icon={TrendingUp}
          variant="default"
          delay={150}
        />
      </div>

      {/* Category Breakdown */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Categorías</span>
          </div>
          <Link 
            to="/investments" 
            className="text-xs text-cream-muted hover:text-cream transition-colors flex items-center gap-1"
          >
            Ver Todo <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(stats?.investments_by_category || {}).map(([category, count], index) => (
            <div 
              key={category}
              className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 transition-all duration-300 hover:border-border-strong hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-cream/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{categoryIcons[category] || '📦'}</span>
                  <span className="font-mono text-lg font-semibold text-cream">{count}</span>
                </div>
                <p className="text-xs text-text-secondary capitalize">{categoryLabels[category] || category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <section className="glass-card-elevated">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated">
                <Clock className="h-4 w-4 text-cream-muted" />
              </div>
              <span className="text-sm font-semibold text-text-primary">Subidas Recientes</span>
            </div>
            <Link 
              to="/files"
              className="glyph-btn glyph-btn-ghost py-1.5 px-3 text-xs"
            >
              Ver Todo
            </Link>
          </div>
          
          <div className="p-2">
            {stats?.recent_uploads?.length ? (
              <div className="space-y-1">
                {stats.recent_uploads.slice(0, 5).map((file, index) => (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-surface transition-colors group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-surface-elevated group-hover:bg-cream/10 transition-colors">
                        <FileText className="h-4 w-4 text-text-muted group-hover:text-cream transition-colors" />
                      </div>
                      <span className="text-sm text-text-secondary truncate group-hover:text-text-primary transition-colors">
                        {file.original_filename}
                      </span>
                    </div>
                    <span className={`text-[10px] font-medium tracking-wider uppercase px-2 py-1 rounded-full ${
                      file.status === 'completed' 
                        ? 'bg-success-dim text-success' 
                        : file.status === 'processing'
                        ? 'bg-info-dim text-info'
                        : 'bg-warning-dim text-warning'
                    }`}>
                      {file.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-elevated flex items-center justify-center">
                  <FileText className="h-5 w-5 text-text-muted" />
                </div>
                <p className="text-sm text-text-muted">No hay subidas recientes</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Investments */}
        <section className="glass-card-elevated">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated">
                <TrendingUp className="h-4 w-4 text-cream-muted" />
              </div>
              <span className="text-sm font-semibold text-text-primary">Inversiones Recientes</span>
            </div>
            <Link 
              to="/investments"
              className="glyph-btn glyph-btn-ghost py-1.5 px-3 text-xs"
            >
              Ver Todo
            </Link>
          </div>
          
          <div className="p-2">
            {Array.isArray(investments) && investments.length > 0 ? (
              <div className="space-y-1">
                {investments.slice(0, 5).map((inv, index) => (
                  <Link
                    key={inv.id}
                    to={`/investments/${inv.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-surface transition-colors group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate group-hover:text-cream transition-colors">
                        {inv.name}
                      </p>
                      <p className="text-xs text-text-muted capitalize flex items-center gap-1 mt-0.5">
                        <span>{categoryIcons[inv.category] || '📦'}</span>
                        <span>{categoryLabels[inv.category] || inv.category}</span>
                        <span className="text-border-strong">•</span>
                        <span>{inv.city || 'Sin ubicación'}</span>
                      </p>
                    </div>
                    <span className="font-mono text-sm text-cream ml-4">
                      {inv.current_value ? formatCurrency(inv.current_value) : '—'}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-elevated flex items-center justify-center">
                  <Trees className="h-5 w-5 text-text-muted" />
                </div>
                <p className="text-sm text-text-muted">Aún no hay inversiones</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

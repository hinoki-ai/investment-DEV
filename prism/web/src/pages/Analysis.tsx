import { useQuery } from '@tanstack/react-query'
import { 
  Brain, 
  Clock, 
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Cpu,
  Sparkles,
  Activity
} from 'lucide-react'
import { analysisApi } from '../lib/api'
import { formatDate } from '../lib/utils'
import StatCard from '../components/StatCard'

const jobStatusConfig: Record<string, { icon: React.ReactNode; className: string }> = {
  queued: { 
    icon: <Clock className="h-4 w-4" />, 
    className: 'bg-warning-dim text-warning border-warning/20' 
  },
  running: { 
    icon: <Loader2 className="h-4 w-4 animate-spin" />, 
    className: 'bg-info-dim text-info border-info/20' 
  },
  completed: { 
    icon: <CheckCircle className="h-4 w-4" />, 
    className: 'bg-success-dim text-success border-success/20' 
  },
  failed: { 
    icon: <XCircle className="h-4 w-4" />, 
    className: 'bg-error-dim text-error border-error/20' 
  },
}

export default function Analysis() {
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['analysis-jobs'],
    queryFn: analysisApi.listJobs,
  })

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['analysis-results'],
    queryFn: analysisApi.listResults,
  })

  const { data: queueStats } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: analysisApi.getQueueStats,
  })

  const totalJobs = queueStats?.total || 0
  const queuedJobs = queueStats?.by_status?.queued || 0
  const runningJobs = queueStats?.by_status?.running || 0
  const completedJobs = queueStats?.by_status?.completed || 0

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-cream-muted" />
            <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Prism</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Análisis</h1>
          <p className="text-text-secondary mt-1">
            Análisis automático de documentos del portafolio
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Cpu className="h-4 w-4 text-cream" />
          <span className="text-cream">Prism</span>
        </div>
      </div>

      {/* Queue Stats */}
      {queueStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
          <StatCard
            title="Total Jobs"
            value={totalJobs}
            description="Análisis históricos"
            icon={Brain}
            variant="default"
            delay={0}
          />
          <StatCard
            title="En Cola"
            value={queuedJobs}
            description="Esperando procesamiento"
            icon={Clock}
            variant={queuedJobs > 0 ? 'accent' : 'default'}
            delay={50}
          />
          <StatCard
            title="Procesando"
            value={runningJobs}
            description="En proceso actualmente"
            icon={Activity}
            variant={runningJobs > 0 ? 'accent' : 'default'}
            delay={100}
          />
          <StatCard
            title="Completados"
            value={completedJobs}
            description="Analizados exitosamente"
            icon={CheckCircle}
            variant="default"
            delay={150}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Jobs */}
        <section className="glass-card-elevated">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated">
                <Activity className="h-4 w-4 text-cream-muted" />
              </div>
              <span className="text-sm font-semibold text-text-primary">Cola de Procesamiento</span>
            </div>
            {runningJobs > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-info">
                <span className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
                Procesando
              </span>
            )}
          </div>
          
          <div className="p-2">
            {jobsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-surface rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (jobs as any[])?.length ? (
              <div className="space-y-2">
                {(jobs as any[]).slice(0, 8).map((job: any, index: number) => {
                  const config = jobStatusConfig[job.status] || jobStatusConfig.queued
                  return (
                    <div 
                      key={job.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border-subtle hover:border-border transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`p-2 rounded-lg ${config.className}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {job.filename || 'Unknown file'}
                        </p>
                        <p className="text-xs text-text-muted">
                          {job.job_type} • Reintento {job.retry_count} • {formatDate(job.created_at)}
                        </p>
                      </div>
                      {job.error_message && (
                        <div className="group relative">
                          <AlertCircle className="h-4 w-4 text-error flex-shrink-0 cursor-help" />
                          <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-surface-elevated text-text-primary text-xs rounded-xl border border-border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            {job.error_message}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <p className="text-sm text-text-muted">No hay jobs en cola</p>
              </div>
            )}
          </div>
        </section>

        {/* Analysis Results */}
        <section className="glass-card-elevated">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated">
                <Sparkles className="h-4 w-4 text-cream-muted" />
              </div>
              <span className="text-sm font-semibold text-text-primary">Resultados Recientes</span>
            </div>
          </div>
          
          <div className="p-2">
            {resultsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-surface rounded-xl animate-pulse" />
                ))}
              </div>
            ) : results && (results as any[]).length ? (
              <div className="space-y-3">
                {(results as any[]).map((result: any, index: number) => (
                  <div 
                    key={result.id} 
                    className="p-4 rounded-xl bg-surface border border-border-subtle hover:border-border transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-cream capitalize">
                            {result.analysis_type}
                          </span>
                          <span className="text-border-strong">•</span>
                          <span className="text-xs text-text-muted">
                            {formatDate(result.created_at)}
                          </span>
                        </div>
                        {result.summary && (
                          <p className="text-sm text-text-secondary line-clamp-2">
                            {result.summary}
                          </p>
                        )}
                        {result.raw_text && !result.summary && (
                          <p className="text-sm text-text-secondary line-clamp-2">
                            {result.raw_text.substring(0, 150)}...
                          </p>
                        )}
                      </div>
                      {result.confidence_score !== undefined && (
                        <div className="flex-shrink-0 text-right">
                          <div className={`text-sm font-mono font-semibold ${
                            result.confidence_score >= 0.8 ? 'text-success' :
                            result.confidence_score >= 0.5 ? 'text-warning' :
                            'text-error'
                          }`}>
                            {Math.round(result.confidence_score * 100)}%
                          </div>
                          <div className="text-[10px] text-text-muted uppercase tracking-wider">confianza</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface flex items-center justify-center">
                  <Brain className="h-5 w-5 text-text-muted" />
                </div>
                <p className="text-sm text-text-muted">
                  Aún no hay resultados de análisis
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Sube documentos y se analizarán automáticamente
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

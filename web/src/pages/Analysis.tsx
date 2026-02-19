import { useQuery } from '@tanstack/react-query'
import { 
  Brain, 
  Clock, 
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { analysisApi } from '../lib/api'
import { formatDate } from '../lib/utils'

const jobStatusIcons: Record<string, React.ReactNode> = {
  queued: <Clock className="h-5 w-5 text-yellow-500" />,
  running: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
  completed: <CheckCircle className="h-5 w-5 text-green-500" />,
  failed: <XCircle className="h-5 w-5 text-red-500" />,
}

const jobStatusColors: Record<string, string> = {
  queued: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  running: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Analysis</h1>
        <p className="text-gray-600 mt-1">
          Kimi K2.5-powered document analysis and insights
        </p>
      </div>

      {/* Queue Stats */}
      {queueStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card py-4">
            <p className="text-2xl font-bold text-gray-900">{queueStats.total}</p>
            <p className="text-sm text-gray-600">Total Jobs</p>
          </div>
          <div className="card py-4">
            <p className="text-2xl font-bold text-yellow-600">
              {queueStats.by_status?.queued || 0}
            </p>
            <p className="text-sm text-gray-600">Queued</p>
          </div>
          <div className="card py-4">
            <p className="text-2xl font-bold text-blue-600">
              {queueStats.by_status?.running || 0}
            </p>
            <p className="text-sm text-gray-600">Running</p>
          </div>
          <div className="card py-4">
            <p className="text-2xl font-bold text-green-600">
              {queueStats.by_status?.completed || 0}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </div>
      )}

      {/* Processing Jobs */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Processing Queue</h2>
        </div>
        
        {jobsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (jobs as any[])?.length ? (
          <div className="space-y-3">
            {jobs.slice(0, 10).map((job: any) => (
              <div 
                key={job.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${jobStatusColors[job.status]}`}
              >
                {jobStatusIcons[job.status]}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">
                    {job.filename}
                  </p>
                  <p className="text-sm opacity-75">
                    {job.job_type} • Retry {job.retry_count} • {formatDate(job.created_at)}
                  </p>
                </div>
                {job.error_message && (
                  <div className="group relative">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 cursor-help" />
                    <div className="absolute right-0 top-full mt-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                      {job.error_message}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No jobs in queue</p>
        )}
      </div>

      {/* Analysis Results */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Results</h2>
        
        {resultsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : results && (results as any[]).length ? (
          <div className="space-y-4">
            {results.map((result: any) => (
              <div key={result.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary-600 capitalize">
                        {result.analysis_type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(result.created_at)}
                      </span>
                    </div>
                    {result.summary && (
                      <p className="text-gray-700 mt-1 line-clamp-2">
                        {result.summary}
                      </p>
                    )}
                    {result.raw_text && !result.summary && (
                      <p className="text-gray-700 mt-1 line-clamp-2">
                        {result.raw_text.substring(0, 200)}...
                      </p>
                    )}
                  </div>
                  {result.confidence_score !== undefined && (
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm font-medium ${
                        result.confidence_score >= 0.8 ? 'text-green-600' :
                        result.confidence_score >= 0.5 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {Math.round(result.confidence_score * 100)}% confidence
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No analysis results yet. Upload documents and they will be analyzed automatically.
          </p>
        )}
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { 
  Trees, 
  DollarSign, 
  FileText, 
  Brain,
  TrendingUp,
  Clock
} from 'lucide-react'
import StatCard from '../components/StatCard'
import { dashboardApi, investmentsApi } from '../lib/api'
import { formatCurrency, formatNumber } from '../lib/utils'

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
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-32 animate-pulse bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your family's investment portfolio
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Investments"
          value={formatNumber(stats?.total_investments || 0)}
          description="Across all categories"
          icon={Trees}
          color="green"
        />
        <StatCard
          title="Portfolio Value"
          value={formatCurrency(stats?.total_value || 0)}
          description="Current estimated value"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Files Stored"
          value={formatNumber(stats?.total_files || 0)}
          description="Documents & media"
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="AI Analyses"
          value={formatNumber(stats?.completed_analyses || 0)}
          description={`${stats?.pending_analyses || 0} pending`}
          icon={Brain}
          color="orange"
        />
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Investments by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(stats?.investments_by_category || {}).map(([category, count]) => (
            <div 
              key={category}
              className="bg-gray-50 rounded-lg p-4 text-center"
            >
              <p className="text-2xl font-bold text-primary-600">{count}</p>
              <p className="text-sm text-gray-600 capitalize">{category}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Uploads</h2>
          </div>
          <div className="space-y-3">
            {stats?.recent_uploads?.length ? (
              stats.recent_uploads.map((file) => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">
                      {file.original_filename}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                    file.status === 'completed' 
                      ? 'bg-green-100 text-green-700'
                      : file.status === 'processing'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {file.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent uploads</p>
            )}
          </div>
        </div>

        {/* Recent Investments */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Investments</h2>
          </div>
          <div className="space-y-3">
            {(investments as any[])?.slice(0, 5).map((inv) => (
              <div 
                key={inv.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {inv.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {inv.category} • {inv.city || 'No location'}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900 flex-shrink-0">
                  {inv.current_value ? formatCurrency(inv.current_value) : '—'}
                </span>
              </div>
            ))}
            {!investments?.length && (
              <p className="text-gray-500 text-sm">No investments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/*
===============================================================================
ANALYTICS PAGE - Financial Math Dashboard
===============================================================================
Comprehensive investment analysis with ROI, CAGR, IRR, NPV, and portfolio
optimization using Modern Portfolio Theory.
*/
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  AlertTriangle,
  Target,
  Zap,
  Award,
  Percent,
  Calendar,
  DollarSign,
  Shield,
  BrainCircuit
} from 'lucide-react'
import { analyticsApi, type InvestmentMetrics, type ComparisonResult } from '../lib/api'

// =============================================================================
// TYPES
// =============================================================================

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  highlight?: boolean
}

interface SectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

function MetricCard({ title, value, subtitle, trend, icon, highlight }: MetricCardProps) {
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-text-secondary'
  
  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'border-cream/30 bg-cream/5' : 'border-border bg-surface'} transition-all hover:border-cream/20`}>
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-md bg-void-deep text-cream">{icon}</div>
        {trend && (
          <span className={trendColor}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xs text-text-muted uppercase tracking-wider">{title}</p>
        <p className="text-xl font-display font-semibold text-text-primary mt-1">{value}</p>
        {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-cream">{icon}</div>
        <h2 className="text-lg font-display font-semibold text-text-primary">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function LoadingState() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-border rounded-full" />
        <div className="absolute inset-0 w-12 h-12 border-2 border-cream border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="mt-4 text-sm text-text-secondary">Calculating metrics...</p>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <AlertTriangle className="w-12 h-12 text-error mb-4" />
      <h2 className="text-lg font-display font-semibold text-text-primary mb-2">Analysis Error</h2>
      <p className="text-sm text-text-secondary max-w-md">{message}</p>
    </div>
  )
}

// =============================================================================
// METRIC DISPLAY COMPONENTS
// =============================================================================

function BasicMetrics({ metrics }: { metrics: InvestmentMetrics['basic'] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        title="Total Invested"
        value={`R$ ${metrics.total_invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        icon={<DollarSign className="w-4 h-4" />}
      />
      <MetricCard
        title="Current Value"
        value={`R$ ${metrics.current_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        icon={<DollarSign className="w-4 h-4" />}
        highlight
      />
      <MetricCard
        title="Absolute Return"
        value={`R$ ${metrics.absolute_return.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        subtitle={metrics.absolute_return >= 0 ? 'Profit' : 'Loss'}
        trend={metrics.absolute_return >= 0 ? 'up' : 'down'}
        icon={<Activity className="w-4 h-4" />}
        highlight={metrics.absolute_return >= 0}
      />
      <MetricCard
        title="Simple ROI"
        value={`${metrics.simple_roi.toFixed(2)}%`}
        trend={metrics.simple_roi >= 0 ? 'up' : 'down'}
        icon={<Percent className="w-4 h-4" />}
        highlight={metrics.simple_roi >= 0}
      />
    </div>
  )
}

function TimeWeightedMetrics({ metrics }: { metrics: InvestmentMetrics['time_weighted'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="CAGR"
        value={metrics.cagr !== null ? `${metrics.cagr.toFixed(2)}%` : 'N/A'}
        subtitle="Compound Annual Growth Rate"
        icon={<TrendingUp className="w-4 h-4" />}
        trend={metrics.cagr && metrics.cagr >= 0 ? 'up' : 'down'}
      />
      <MetricCard
        title="Annualized ROI"
        value={metrics.annualized_roi !== null ? `${metrics.annualized_roi.toFixed(2)}%` : 'N/A'}
        subtitle="Return per year"
        icon={<Calendar className="w-4 h-4" />}
        trend={metrics.annualized_roi && metrics.annualized_roi >= 0 ? 'up' : 'down'}
      />
      <MetricCard
        title="Holding Period"
        value={`${metrics.years_held.toFixed(1)} years`}
        subtitle="Time since purchase"
        icon={<Calendar className="w-4 h-4" />}
      />
    </div>
  )
}

function AdvancedMetrics({ metrics }: { metrics: InvestmentMetrics['advanced'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="IRR"
        value={metrics.irr !== null ? `${metrics.irr.toFixed(2)}%` : 'N/A'}
        subtitle="Internal Rate of Return"
        icon={<BrainCircuit className="w-4 h-4" />}
      />
      <MetricCard
        title="NPV"
        value={metrics.npv !== null ? `R$ ${metrics.npv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}
        subtitle="Net Present Value"
        icon={<DollarSign className="w-4 h-4" />}
      />
      <MetricCard
        title="Payback Period"
        value={metrics.payback_period_months !== null ? `${metrics.payback_period_months.toFixed(1)} months` : 'N/A'}
        subtitle="Time to recover investment"
        icon={<Target className="w-4 h-4" />}
      />
    </div>
  )
}

function RiskMetrics({ metrics }: { metrics: InvestmentMetrics['risk'] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        title="Sharpe Ratio"
        value={metrics.sharpe_ratio !== null ? metrics.sharpe_ratio.toFixed(2) : 'N/A'}
        subtitle="Risk-adjusted return"
        icon={<Award className="w-4 h-4" />}
        highlight={metrics.sharpe_ratio !== null && metrics.sharpe_ratio > 1}
      />
      <MetricCard
        title="Volatility"
        value={metrics.volatility !== null ? `${metrics.volatility.toFixed(2)}%` : 'N/A'}
        subtitle="Annualized std deviation"
        icon={<Activity className="w-4 h-4" />}
      />
      <MetricCard
        title="Max Drawdown"
        value={metrics.max_drawdown !== null ? `${metrics.max_drawdown.toFixed(2)}%` : 'N/A'}
        subtitle="Largest peak-to-trough decline"
        icon={<TrendingDown className="w-4 h-4" />}
      />
      <MetricCard
        title="VaR 95%"
        value={metrics.var_95 !== null ? `${metrics.var_95.toFixed(2)}%` : 'N/A'}
        subtitle="Value at Risk"
        icon={<Shield className="w-4 h-4" />}
      />
    </div>
  )
}

function ComparativeMetrics({ metrics }: { metrics: InvestmentMetrics['comparative'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className={`p-4 rounded-lg border ${metrics.vs_inflation !== null && metrics.vs_inflation > 0 ? 'border-success/30 bg-success/5' : 'border-border bg-surface'}`}>
        <p className="text-xs text-text-muted uppercase tracking-wider">vs Inflation</p>
        <p className={`text-xl font-display font-semibold mt-1 ${metrics.vs_inflation !== null && metrics.vs_inflation > 0 ? 'text-success' : 'text-text-primary'}`}>
          {metrics.vs_inflation !== null ? `${metrics.vs_inflation.toFixed(2)}%` : 'N/A'}
        </p>
        <p className="text-xs text-text-secondary mt-1">Real return after inflation</p>
      </div>
      
      <div className={`p-4 rounded-lg border ${metrics.vs_cdi !== null && metrics.vs_cdi > 0 ? 'border-success/30 bg-success/5' : 'border-border bg-surface'}`}>
        <p className="text-xs text-text-muted uppercase tracking-wider">vs CDI</p>
        <p className={`text-xl font-display font-semibold mt-1 ${metrics.vs_cdi !== null && metrics.vs_cdi > 0 ? 'text-success' : 'text-text-primary'}`}>
          {metrics.vs_cdi !== null ? `${metrics.vs_cdi.toFixed(2)}%` : 'N/A'}
        </p>
        <p className="text-xs text-text-secondary mt-1">vs Brazil risk-free rate</p>
      </div>
      
      <div className={`p-4 rounded-lg border ${metrics.vs_sp500 !== null && metrics.vs_sp500 > 0 ? 'border-success/30 bg-success/5' : 'border-border bg-surface'}`}>
        <p className="text-xs text-text-muted uppercase tracking-wider">vs S&P 500</p>
        <p className={`text-xl font-display font-semibold mt-1 ${metrics.vs_sp500 !== null && metrics.vs_sp500 > 0 ? 'text-success' : 'text-text-primary'}`}>
          {metrics.vs_sp500 !== null ? `${metrics.vs_sp500.toFixed(2)}%` : 'N/A'}
        </p>
        <p className="text-xs text-text-secondary mt-1">vs US stock market</p>
      </div>
    </div>
  )
}

// =============================================================================
// RECOMMENDATIONS COMPONENT
// =============================================================================

function Recommendations({ comparison }: { comparison: ComparisonResult }) {
  return (
    <div className="space-y-4">
      {/* Winner */}
      {comparison.winner && (
        <div className="p-4 rounded-lg border border-success/30 bg-success/5">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-success" />
            <span className="font-display font-semibold text-success">Top Performer</span>
          </div>
          <p className="text-text-primary">{comparison.winner.name}</p>
          <p className="text-sm text-text-secondary">Composite Score: {comparison.winner.score.toFixed(1)}</p>
        </div>
      )}
      
      {/* Recommendations */}
      {comparison.recommendations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-secondary">Recommendations</h3>
          {comparison.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-text-primary">
              <span className="text-success mt-0.5">✓</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Warnings */}
      {comparison.warnings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-secondary">Warnings</h3>
          {comparison.warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-warning">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Opportunities */}
      {comparison.opportunities.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-secondary">Opportunities</h3>
          {comparison.opportunities.map((opp, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-info">
              <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{opp}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MAIN ANALYTICS PAGE
// =============================================================================

export default function Analytics() {
  const [selectedInvestment, setSelectedInvestment] = useState<string | null>(null)
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced')
  
  // Fetch portfolio summary
  const { data: portfolioData, isLoading: portfolioLoading, error: portfolioError } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: () => analyticsApi.getPortfolioSummary(),
  })
  
  // Fetch comparison data
  const { data: comparisonData, isLoading: comparisonLoading } = useQuery({
    queryKey: ['comparison-all', riskProfile],
    queryFn: () => analyticsApi.compareAll({ limit: 20 }),
  })
  
  // Fetch individual metrics if selected
  const { data: metricsData } = useQuery({
    queryKey: ['investment-metrics', selectedInvestment],
    queryFn: () => selectedInvestment ? analyticsApi.getInvestmentMetrics(selectedInvestment) : null,
    enabled: !!selectedInvestment,
  })
  
  // Fetch benchmarks
  const { data: benchmarksData } = useQuery({
    queryKey: ['benchmarks'],
    queryFn: () => analyticsApi.getBenchmarks(),
  })
  
  const isLoading = portfolioLoading || comparisonLoading
  
  if (isLoading) return <LoadingState />
  if (portfolioError) return <ErrorState message="Failed to load analytics data" />
  
  const portfolio = portfolioData?.data
  const comparison = comparisonData?.data
  const metrics = metricsData?.data
  const benchmarks = benchmarksData?.data
  
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-cream" />
          Analytics
        </h1>
        <p className="text-text-secondary mt-2">
          Comprehensive financial analysis and portfolio optimization
        </p>
      </div>
      
      {/* Portfolio Summary */}
      {portfolio && (
        <Section title="Portfolio Summary" icon={<PieChart className="w-5 h-5" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Value"
              value={`R$ ${portfolio.summary.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={<DollarSign className="w-4 h-4" />}
              highlight
            />
            <MetricCard
              title="Total Invested"
              value={`R$ ${portfolio.summary.total_invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={<DollarSign className="w-4 h-4" />}
            />
            <MetricCard
              title="Total Return"
              value={`${portfolio.summary.total_roi.toFixed(2)}%`}
              trend={portfolio.summary.total_roi >= 0 ? 'up' : 'down'}
              icon={<Percent className="w-4 h-4" />}
              highlight={portfolio.summary.total_roi >= 0}
            />
            <MetricCard
              title="Weighted CAGR"
              value={portfolio.summary.weighted_cagr !== null ? `${portfolio.summary.weighted_cagr.toFixed(2)}%` : 'N/A'}
              icon={<TrendingUp className="w-4 h-4" />}
            />
          </div>
          
          {/* Category Allocation */}
          <div className="p-4 rounded-lg border border-border bg-surface">
            <h3 className="text-sm font-medium text-text-secondary mb-3">Category Allocation</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(portfolio.allocation).map(([category, percentage]) => (
                <div key={category} className="px-3 py-1.5 rounded-full bg-void-deep border border-border">
                  <span className="text-sm text-text-primary capitalize">{category}</span>
                  <span className="text-sm text-cream ml-2">{percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}
      
      {/* Investment Comparison */}
      {comparison && (
        <Section title="Investment Rankings" icon={<Award className="w-5 h-5" />}>
          <div className="mb-4">
            <label className="text-sm text-text-secondary mr-3">Risk Profile:</label>
            <select
              value={riskProfile}
              onChange={(e) => setRiskProfile(e.target.value as any)}
              className="px-3 py-1.5 rounded-md bg-void-deep border border-border text-text-primary text-sm focus:border-cream focus:outline-none"
            >
              <option value="conservative">Conservative</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
          
          {/* Rankings Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-void-deep">
                <tr>
                  <th className="px-4 py-3 text-left text-text-secondary font-medium">Rank</th>
                  <th className="px-4 py-3 text-left text-text-secondary font-medium">Investment</th>
                  <th className="px-4 py-3 text-left text-text-secondary font-medium">Category</th>
                  <th className="px-4 py-3 text-right text-text-secondary font-medium">ROI</th>
                  <th className="px-4 py-3 text-right text-text-secondary font-medium">CAGR</th>
                  <th className="px-4 py-3 text-right text-text-secondary font-medium">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparison.rankings.map((inv) => (
                  <tr 
                    key={inv.investment_id}
                    className="hover:bg-surface/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedInvestment(inv.investment_id)}
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        inv.rankings.composite === 1 ? 'bg-success/20 text-success' :
                        inv.rankings.composite === 2 ? 'bg-cream/20 text-cream' :
                        inv.rankings.composite === 3 ? 'bg-warning/20 text-warning' :
                        'bg-void-deep text-text-secondary'
                      }`}>
                        {inv.rankings.composite}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-primary font-medium">{inv.name}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{inv.category}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={(inv.metrics.simple_roi ?? 0) >= 0 ? 'text-success' : 'text-error'}>
                        {inv.metrics.simple_roi?.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={inv.metrics.cagr && inv.metrics.cagr >= 0 ? 'text-success' : 'text-error'}>
                        {inv.metrics.cagr?.toFixed(2) ?? 'N/A'}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-cream font-medium">{inv.scores.composite.toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Recommendations */}
          <div className="mt-6">
            <Recommendations comparison={comparison} />
          </div>
        </Section>
      )}
      
      {/* Individual Investment Detail */}
      {selectedInvestment && metrics && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-border p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-display font-semibold text-text-primary">{metrics.name}</h2>
                <p className="text-sm text-text-secondary capitalize">{metrics.category}</p>
              </div>
              <button
                onClick={() => setSelectedInvestment(null)}
                className="p-2 rounded-lg hover:bg-void-deep text-text-secondary hover:text-text-primary transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              <Section title="Basic Metrics" icon={<DollarSign className="w-5 h-5" />}>
                <BasicMetrics metrics={metrics.basic} />
              </Section>
              
              <Section title="Time-Weighted Returns" icon={<Calendar className="w-5 h-5" />}>
                <TimeWeightedMetrics metrics={metrics.time_weighted} />
              </Section>
              
              <Section title="Advanced Metrics" icon={<BrainCircuit className="w-5 h-5" />}>
                <AdvancedMetrics metrics={metrics.advanced} />
              </Section>
              
              <Section title="Risk Analysis" icon={<Shield className="w-5 h-5" />}>
                <RiskMetrics metrics={metrics.risk} />
              </Section>
              
              <Section title="Benchmark Comparison" icon={<BarChart3 className="w-5 h-5" />}>
                <ComparativeMetrics metrics={metrics.comparative} />
              </Section>
            </div>
          </div>
        </div>
      )}
      
      {/* Benchmark Rates */}
      {benchmarks && (
        <Section title="Benchmark Rates" icon={<Target className="w-5 h-5" />}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(benchmarks.values).map(([key, value]) => (
              <div key={key} className="p-3 rounded-lg border border-border bg-surface">
                <p className="text-xs text-text-muted uppercase tracking-wider">{key.replace('_', ' ')}</p>
                <p className="text-lg font-display font-semibold text-text-primary">{value.toFixed(2)}%</p>
                <p className="text-xs text-text-secondary">{benchmarks.description[key]}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

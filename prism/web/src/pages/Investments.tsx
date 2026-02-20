/* eslint-disable @typescript-eslint/no-explicit-any */
/*
===============================================================================
INVERSIONES PAGE - Maximum Power Investment Dashboard
===============================================================================
Full-featured investment overview with portfolio health gauge, ROI heat map,
wealth timeline, performance waterfall, category allocation, treemap,
and enriched investment cards.
*/
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus, Search, MapPin, DollarSign,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  Grid3X3, List, TrendingUp, TrendingDown,
  PieChart, BarChart3, Trophy, AlertTriangle,
  X, Award, Target, Activity,
  Flame, Snowflake, Crown,
  Percent, Layers
} from 'lucide-react'
import {
  PieChart as RechartsPie, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  Treemap, AreaChart, Area, Legend
} from 'recharts'
import { investmentsApi, dashboardApi, analyticsApi } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import { InvestmentForm, type InvestmentFormData } from '../components/InvestmentForm'

// =============================================================================
// CONSTANTS
// =============================================================================

const categories = [
  { value: '', label: 'Todas', icon: '🌐' },
  { value: 'land', label: 'Terrenos', icon: '🏞️' },
  { value: 'stocks', label: 'Acciones', icon: '📈' },
  { value: 'gold', label: 'Oro', icon: '🪙' },
  { value: 'crypto', label: 'Crypto', icon: '₿' },
  { value: 'real_estate', label: 'Inmuebles', icon: '🏢' },
  { value: 'bonds', label: 'Bonos', icon: '📜' },
  { value: 'other', label: 'Otros', icon: '📦' },
]

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-success-dim text-success border-success/20' },
  sold: { label: 'Vendido', className: 'bg-surface text-text-muted border-border' },
  pending: { label: 'Pendiente', className: 'bg-warning-dim text-warning border-warning/20' },
  under_contract: { label: 'En Contrato', className: 'bg-info-dim text-info border-info/20' },
}

const categoryIcons: Record<string, string> = {
  land: '🏞️', stocks: '📈', gold: '🪙', crypto: '₿',
  real_estate: '🏢', bonds: '📜', other: '📦'
}

const categoryLabels: Record<string, string> = {
  land: 'Terrenos', stocks: 'Acciones', gold: 'Oro', crypto: 'Crypto',
  real_estate: 'Inmuebles', bonds: 'Bonos', other: 'Otros'
}

const CATEGORY_COLORS: Record<string, string> = {
  land: '#7fb069', stocks: '#6b8cae', gold: '#d4a373', crypto: '#8b7ec8',
  real_estate: '#e8d5c4', bonds: '#5bbdb4', other: '#a89482',
}

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-elevated border border-border rounded-xl px-4 py-3 shadow-xl backdrop-blur-xl">
      {label && <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="text-sm text-text-primary font-medium">
            {entry.name}: {typeof entry.value === 'number' && entry.name?.toLowerCase().includes('roi')
              ? `${entry.value.toFixed(1)}%`
              : typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function TreemapContent({ x, y, width, height, name, value, color }: any) {
  if (width < 50 || height < 30) return null
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={8}
        fill={color} fillOpacity={0.85} stroke="rgba(10,10,10,0.5)" strokeWidth={2}
        className="transition-all duration-300 hover:fill-opacity-100" />
      {width > 70 && height > 50 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 8} textAnchor="middle"
            fill="#0a0a0a" fontSize={width > 120 ? 13 : 11} fontWeight={700}
            fontFamily="Inter, system-ui, sans-serif">{name}</text>
          <text x={x + width / 2} y={y + height / 2 + 12} textAnchor="middle"
            fill="rgba(10,10,10,0.7)" fontSize={width > 120 ? 11 : 9}
            fontFamily="JetBrains Mono, monospace">{formatCurrency(value)}</text>
        </>
      )}
    </g>
  )
}

function renderCustomizedLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.05) return null
  return (
    <text x={x} y={y} fill="#f5f2ed" textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central" fontSize={11} fontFamily="Inter, system-ui, sans-serif">
      {`${categoryLabels[name] || name} ${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// =============================================================================
// PORTFOLIO HEALTH GAUGE
// =============================================================================

function PortfolioHealthGauge({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (score / 100) * circumference
  const color = score >= 75 ? '#7fb069' : score >= 50 ? '#d4a373' : '#c76b6b'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(232,213,196,0.06)" strokeWidth="8" />
          <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            className="gauge-arc" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[9px] text-text-muted uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <span className="text-xs text-text-muted mt-2 uppercase tracking-wider">{label}</span>
    </div>
  )
}

// =============================================================================
// ROI HEAT MAP
// =============================================================================

function RoiHeatMap({ investments }: { investments: any[] }) {
  const sorted = [...investments]
    .filter((inv: any) => inv.return_percentage !== undefined && inv.return_percentage !== null)
    .sort((a: any, b: any) => (b.return_percentage || 0) - (a.return_percentage || 0))

  if (sorted.length === 0) return null

  const getHeatColor = (roi: number) => {
    if (roi >= 50) return 'bg-emerald-500/80 text-white'
    if (roi >= 20) return 'bg-emerald-600/60 text-white'
    if (roi >= 10) return 'bg-emerald-700/40 text-emerald-100'
    if (roi >= 0) return 'bg-emerald-900/30 text-emerald-200'
    if (roi >= -10) return 'bg-red-900/30 text-red-200'
    if (roi >= -20) return 'bg-red-700/40 text-red-100'
    return 'bg-red-500/60 text-white'
  }

  return (
    <section className="glass-card-elevated overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <Flame className="h-4 w-4 text-cream-muted" />
        <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">
          Mapa de Calor ROI
        </span>
        <div className="ml-auto flex items-center gap-1 text-[9px] text-text-muted">
          <Snowflake className="h-3 w-3 text-red-400" />
          <span>Frío</span>
          <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 mx-1" />
          <span>Caliente</span>
          <Flame className="h-3 w-3 text-emerald-400" />
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {sorted.map((inv: any, i: number) => (
            <Link key={inv.id} to={`/investments/${inv.id}`}
              className={`heat-cell relative rounded-xl p-3 ${getHeatColor(inv.return_percentage || 0)} cursor-pointer group`}
              style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs">{categoryIcons[inv.category] || '📦'}</span>
                <span className="text-[10px] font-semibold truncate">{inv.name}</span>
              </div>
              <div className="font-mono text-lg font-bold">
                {(inv.return_percentage || 0) >= 0 ? '+' : ''}{(inv.return_percentage || 0).toFixed(1)}%
              </div>
              <div className="text-[9px] opacity-70 font-mono">{formatCurrency(inv.current_value || 0)}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// =============================================================================
// ADD INVESTMENT MODAL
// =============================================================================

function AddInvestmentModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const createMutation = useMutation({
    mutationFn: (data: InvestmentFormData) => investmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['category-breakdown'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] })
      onClose()
    },
  })
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 bg-surface border-b border-border p-5 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Nueva Inversión</h2>
            <p className="text-xs text-text-muted mt-0.5">Agrega un nuevo activo a tu portafolio</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <InvestmentForm mode="create" onSubmit={(data) => createMutation.mutate(data)}
            onCancel={onClose} isSubmitting={createMutation.isPending} />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN INVESTMENTS PAGE
// =============================================================================

export default function Investments() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showAddModal, setShowAddModal] = useState(false)
  const [sortBy, setSortBy] = useState<'value' | 'return' | 'name'>('value')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Data queries
  const { data: investments, isLoading: investmentsLoading } = useQuery({
    queryKey: ['investments'], queryFn: () => investmentsApi.list(),
  })
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'], queryFn: dashboardApi.getStats,
  })
  const { data: breakdownData } = useQuery({
    queryKey: ['category-breakdown'], queryFn: dashboardApi.getCategoryBreakdown,
  })
  const { data: portfolioData } = useQuery({
    queryKey: ['portfolio-summary'], queryFn: () => analyticsApi.getPortfolioSummary(),
  })

  const investmentsArray = useMemo(() => Array.isArray(investments) ? investments : [], [investments])

  // Sort & filter
  const sortedInvestments = useMemo(() => {
    const arr = [...investmentsArray]
    arr.sort((a: any, b: any) => {
      let aVal: number, bVal: number
      if (sortBy === 'value') { aVal = a.current_value || 0; bVal = b.current_value || 0 }
      else if (sortBy === 'return') { aVal = a.return_percentage || 0; bVal = b.return_percentage || 0 }
      else { return sortDir === 'asc' ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || '') }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
    return arr
  }, [investmentsArray, sortBy, sortDir])

  const filteredInvestments = sortedInvestments.filter((inv: any) => {
    const matchesSearch = inv.name?.toLowerCase().includes(search.toLowerCase()) || inv.city?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !category || inv.category === category
    return matchesSearch && matchesCategory
  })

  // Computed metrics
  const totalValue = stats?.total_value || 0
  const totalInvested = stats?.total_invested || 0
  const totalReturn = stats?.total_return || 0
  const totalReturnPct = stats?.total_return_pct || 0
  const totalCount = investmentsArray.length

  // Portfolio health score (diversification + return + count)
  const healthScore = useMemo(() => {
    const uniqueCategories = new Set(investmentsArray.map((i: any) => i.category)).size
    const diversification = Math.min(uniqueCategories / 5 * 40, 40)
    const returnScore = Math.min(Math.max(totalReturnPct + 10, 0) / 30 * 35, 35)
    const countScore = Math.min(totalCount / 10 * 25, 25)
    return Math.round(diversification + returnScore + countScore)
  }, [investmentsArray, totalReturnPct, totalCount])

  // Category breakdown for pie chart
  const categoryPieData = useMemo(() => {
    if (!breakdownData?.breakdown) return []
    return breakdownData.breakdown
      .filter((b: any) => b.total_value > 0)
      .map((b: any) => ({ name: b.category, value: b.total_value, count: b.count, fill: CATEGORY_COLORS[b.category] || '#a89482' }))
  }, [breakdownData])

  // Performance bar chart
  const performanceBarData = useMemo(() => {
    return investmentsArray
      .filter((inv: any) => inv.return_percentage !== undefined && inv.return_percentage !== null)
      .map((inv: any) => ({
        name: inv.name?.length > 18 ? inv.name.substring(0, 18) + '…' : inv.name,
        fullName: inv.name, roi: inv.return_percentage || 0,
        value: inv.current_value || 0, invested: inv.purchase_price || 0,
        fill: (inv.return_percentage || 0) >= 0 ? '#7fb069' : '#c76b6b',
      }))
      .sort((a: any, b: any) => b.roi - a.roi)
      .slice(0, 12)
  }, [investmentsArray])

  // Wealth timeline
  const wealthTimeline = useMemo(() => {
    const timeline = investmentsArray
      .filter((inv: any) => inv.purchase_date && inv.purchase_price)
      .sort((a: any, b: any) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime())

    let cumInvested = 0, cumValue = 0
    return timeline.map((inv: any) => {
      cumInvested += inv.purchase_price || 0
      cumValue += inv.current_value || 0
      return {
        date: new Date(inv.purchase_date).toLocaleDateString('es-CL', { month: 'short', year: '2-digit' }),
        invertido: cumInvested, valor: cumValue, name: inv.name,
      }
    })
  }, [investmentsArray])

  // Treemap data
  const flatTreemapData = useMemo(() => {
    return investmentsArray
      .filter((inv: any) => inv.current_value && inv.current_value > 0)
      .map((inv: any) => ({
        name: inv.name?.length > 20 ? inv.name.substring(0, 20) + '…' : inv.name,
        value: inv.current_value, color: CATEGORY_COLORS[inv.category] || '#a89482',
      }))
  }, [investmentsArray])

  // Top & worst
  const topPerformer = useMemo(() => {
    if (!investmentsArray.length) return null
    return investmentsArray.reduce((best: any, inv: any) =>
      (inv.return_percentage || 0) > (best.return_percentage || 0) ? inv : best, investmentsArray[0])
  }, [investmentsArray])
  const worstPerformer = useMemo(() => {
    if (!investmentsArray.length) return null
    return investmentsArray.reduce((worst: any, inv: any) =>
      (inv.return_percentage || 0) < (worst.return_percentage || 0) ? inv : worst, investmentsArray[0])
  }, [investmentsArray])

  // Active vs passive income
  const activeCount = investmentsArray.filter((i: any) => i.status === 'active').length
  const portfolio = portfolioData?.data

  const toggleSort = (field: 'value' | 'return' | 'name') => {
    if (sortBy === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }
    else { setSortBy(field); setSortDir('desc') }
  }

  return (
    <div className="space-y-6 fade-in">

      {/* ================================================================= */}
      {/* WEALTH PULSE HERO                                                 */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface-elevated via-surface to-void p-6 sm:p-8 wealth-pulse">
        <div className="absolute inset-0 bg-glyph-pattern bg-glyph opacity-30" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cream/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-cream/3 rounded-full blur-2xl" />
        <div className="absolute right-10 bottom-10 w-32 h-32 bg-success/3 rounded-full blur-2xl" />

        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left side: metrics */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-5 w-5 text-cream" />
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                  Patrimonio de Inversiones
                </h1>
              </div>
              <p className="text-sm text-text-muted mb-5">
                {totalCount} activo{totalCount !== 1 ? 's' : ''} · {activeCount} activo{activeCount !== 1 ? 's' : ''} en portafolio
              </p>

              {/* Big number */}
              <div className="mb-6">
                <span className="text-3xs font-semibold tracking-widest text-cream-muted uppercase">Valor Total Neto</span>
                <p className="font-mono text-4xl sm:text-5xl font-bold number-shimmer tracking-tight mt-1">
                  {formatCurrency(totalValue)}
                </p>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-surface/60 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="h-3 w-3 text-text-muted" />
                    <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">Invertido</span>
                  </div>
                  <p className="font-mono text-lg font-bold text-text-primary">{formatCurrency(totalInvested)}</p>
                </div>

                <div className={`rounded-xl border p-3 ${totalReturn >= 0 ? 'border-success/15 bg-success/5' : 'border-error/15 bg-error/5'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {totalReturn >= 0 ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-error" />}
                    <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">Ganancia</span>
                  </div>
                  <p className={`font-mono text-lg font-bold ${totalReturn >= 0 ? 'text-success' : 'text-error'}`}>
                    {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
                  </p>
                </div>

                <div className={`rounded-xl border p-3 ${totalReturnPct >= 0 ? 'border-success/15 bg-success/5' : 'border-error/15 bg-error/5'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Percent className="h-3 w-3 text-text-muted" />
                    <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">ROI</span>
                  </div>
                  <p className={`font-mono text-lg font-bold ${totalReturnPct >= 0 ? 'text-success' : 'text-error'}`}>
                    {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: health gauge + add button */}
            <div className="flex flex-col items-center gap-4">
              <PortfolioHealthGauge score={healthScore} label="Salud del Portafolio" />
              <button onClick={() => setShowAddModal(true)}
                className="glyph-btn glyph-btn-primary flex items-center gap-2 whitespace-nowrap">
                <Plus className="h-4 w-4" /> Nueva Inversión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* ROI HEAT MAP                                                      */}
      {/* ================================================================= */}
      {investmentsArray.length > 0 && <RoiHeatMap investments={investmentsArray} />}

      {/* ================================================================= */}
      {/* CHARTS ROW 1: Allocation + Performance                           */}
      {/* ================================================================= */}
      {investmentsArray.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Allocation Donut */}
          {categoryPieData.length > 0 && (
            <section className="glass-card-elevated overflow-hidden">
              <div className="p-5 border-b border-border flex items-center gap-2">
                <PieChart className="h-4 w-4 text-cream-muted" />
                <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">
                  Distribución por Categoría
                </span>
              </div>
              <div className="p-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="w-full md:w-1/2" style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                          paddingAngle={3} dataKey="value" nameKey="name" label={renderCustomizedLabel}
                          labelLine={false} animationBegin={0} animationDuration={1200} animationEasing="ease-out">
                          {categoryPieData.map((entry: any, i: number) => (
                            <Cell key={i} fill={entry.fill} stroke="rgba(10,10,10,0.5)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 space-y-2">
                    {categoryPieData.map((entry: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface/50 transition-colors group cursor-default">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill }} />
                          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                            {categoryIcons[entry.name]} {categoryLabels[entry.name] || entry.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-mono text-cream font-medium">{formatCurrency(entry.value)}</span>
                          <span className="text-xs text-text-muted ml-2">({entry.count})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Performance Waterfall */}
          {performanceBarData.length > 0 && (
            <section className="glass-card-elevated overflow-hidden">
              <div className="p-5 border-b border-border flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cream-muted" />
                <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">
                  Rendimiento por Inversión (ROI%)
                </span>
              </div>
              <div className="p-4" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceBarData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                    <CartesianGrid horizontal={false} stroke="rgba(232, 213, 196, 0.06)" />
                    <XAxis type="number" tick={{ fill: '#8a8279', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                      axisLine={{ stroke: 'rgba(232, 213, 196, 0.1)' }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#8a8279', fontSize: 11, fontFamily: 'Inter' }}
                      axisLine={false} tickLine={false} width={130} />
                    <RechartsTooltip content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-surface-elevated border border-border rounded-xl px-4 py-3 shadow-xl">
                          <p className="text-sm font-semibold text-text-primary mb-1">{d.fullName}</p>
                          <p className="text-xs text-text-secondary">
                            ROI: <span className={`font-mono font-semibold ${d.roi >= 0 ? 'text-success' : 'text-error'}`}>
                              {d.roi >= 0 ? '+' : ''}{d.roi.toFixed(2)}%</span>
                          </p>
                          <p className="text-xs text-text-secondary">Valor: <span className="font-mono text-cream">{formatCurrency(d.value)}</span></p>
                        </div>
                      )
                    }} />
                    <Bar dataKey="roi" name="ROI" radius={[0, 6, 6, 0]} animationDuration={1200} animationEasing="ease-out">
                      {performanceBarData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* CHARTS ROW 2: Wealth Timeline + Treemap                          */}
      {/* ================================================================= */}
      {investmentsArray.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wealth Timeline */}
          {wealthTimeline.length > 1 && (
            <section className="lg:col-span-2 glass-card-elevated overflow-hidden">
              <div className="p-5 border-b border-border flex items-center gap-2">
                <Activity className="h-4 w-4 text-cream-muted" />
                <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">
                  Evolución del Patrimonio
                </span>
              </div>
              <div className="p-4" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={wealthTimeline} margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                    <defs>
                      <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e8d5c4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#e8d5c4" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="colorInvertido" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6b8cae" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6b8cae" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,213,196,0.06)" />
                    <XAxis dataKey="date" tick={{ fill: '#8a8279', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#8a8279', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1e6).toFixed(1)}M`} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="invertido" name="Invertido" stroke="#6b8cae" fill="url(#colorInvertido)"
                      strokeWidth={2} animationDuration={1500} />
                    <Area type="monotone" dataKey="valor" name="Valor Actual" stroke="#e8d5c4" fill="url(#colorValor)"
                      strokeWidth={2} animationDuration={1500} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#8a8279' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Top & Worst + CAGR */}
          <section className="glass-card-elevated overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Trophy className="h-4 w-4 text-cream-muted" />
              <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Destacados</span>
            </div>
            <div className="p-4 space-y-4">
              {topPerformer && (
                <Link to={`/investments/${topPerformer.id}`}
                  className="block p-4 rounded-xl border border-success/15 bg-success/5 hover:border-success/25 transition-all duration-200 group">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-success" />
                    <span className="text-2xs font-semibold tracking-widest text-success uppercase">Mejor Rendimiento</span>
                  </div>
                  <p className="text-sm font-semibold text-text-primary group-hover:text-cream transition-colors truncate">
                    {categoryIcons[topPerformer.category]} {topPerformer.name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-lg font-bold text-success">
                      {topPerformer.return_percentage !== undefined ? `${topPerformer.return_percentage >= 0 ? '+' : ''}${topPerformer.return_percentage.toFixed(1)}%` : '—'}
                    </span>
                    <span className="font-mono text-sm text-cream">{topPerformer.current_value ? formatCurrency(topPerformer.current_value) : '—'}</span>
                  </div>
                </Link>
              )}
              {worstPerformer && worstPerformer.id !== topPerformer?.id && (
                <Link to={`/investments/${worstPerformer.id}`}
                  className="block p-4 rounded-xl border border-border bg-surface/40 hover:border-border-strong transition-all duration-200 group">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-2xs font-semibold tracking-widest text-text-muted uppercase">Menor Rendimiento</span>
                  </div>
                  <p className="text-sm font-semibold text-text-primary group-hover:text-cream transition-colors truncate">
                    {categoryIcons[worstPerformer.category]} {worstPerformer.name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`font-mono text-lg font-bold ${(worstPerformer.return_percentage || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                      {worstPerformer.return_percentage !== undefined ? `${worstPerformer.return_percentage >= 0 ? '+' : ''}${worstPerformer.return_percentage.toFixed(1)}%` : '—'}
                    </span>
                    <span className="font-mono text-sm text-cream">{worstPerformer.current_value ? formatCurrency(worstPerformer.current_value) : '—'}</span>
                  </div>
                </Link>
              )}
              {portfolio && (
                <div className="p-4 rounded-xl border border-border bg-surface/40">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-info" />
                    <span className="text-2xs font-semibold tracking-widest text-text-muted uppercase">CAGR Ponderado</span>
                  </div>
                  <p className="font-mono text-2xl font-bold text-cream">
                    {portfolio.summary.weighted_cagr !== null ? `${portfolio.summary.weighted_cagr.toFixed(2)}%` : 'N/A'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Tasa de crecimiento anual compuesta</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Treemap */}
      {flatTreemapData.length > 0 && (
        <section className="glass-card-elevated overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Layers className="h-4 w-4 text-cream-muted" />
            <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">
              Mapa de Valor del Portafolio
            </span>
          </div>
          <div className="p-4" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={flatTreemapData} dataKey="value" nameKey="name"
                aspectRatio={4 / 3} animationDuration={800} content={<TreemapContent />} />
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* FILTERS & SEARCH                                                 */}
      {/* ================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${category === c.value
                ? 'bg-cream text-void shadow-glow' : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-strong'}`}>
              <span>{c.icon}</span><span>{c.label}</span>
              {c.value && (<span className={`text-xs ${category === c.value ? 'text-void/60' : 'text-text-muted'}`}>
                {investmentsArray.filter((inv: any) => inv.category === c.value).length}</span>)}
            </button>
          ))}
        </div>

        <div className="glass-card p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input type="text" placeholder="Buscar inversiones..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="input-field pl-11" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-text-muted mr-1">Ordenar:</span>
                {([{ key: 'value' as const, label: 'Valor' }, { key: 'return' as const, label: 'ROI' }, { key: 'name' as const, label: 'Nombre' }] as const).map(s => (
                  <button key={s.key} onClick={() => toggleSort(s.key)}
                    className={`px-2 py-1 rounded-md transition-colors ${sortBy === s.key ? 'bg-cream/10 text-cream' : 'text-text-muted hover:text-text-primary'}`}>
                    {s.label}{sortBy === s.key && <span className="ml-0.5">{sortDir === 'desc' ? '↓' : '↑'}</span>}
                  </button>
                ))}
              </div>
              <div className="flex items-center bg-surface rounded-lg p-1 border border-border">
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-cream/10 text-cream' : 'text-text-muted hover:text-text-primary'}`}>
                  <List className="h-4 w-4" /></button>
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-cream/10 text-cream' : 'text-text-muted hover:text-text-primary'}`}>
                  <Grid3X3 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{filteredInvestments?.length || 0} inversión{filteredInvestments?.length !== 1 ? 'es' : ''}</span>
        {(search || category) && (
          <button onClick={() => { setSearch(''); setCategory('') }} className="text-cream-muted hover:text-cream transition-colors">
            Limpiar filtros
          </button>)}
      </div>

      {/* ================================================================= */}
      {/* INVESTMENT LIST / GRID                                            */}
      {/* ================================================================= */}
      {investmentsLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (<div key={i} className="h-32 sm:h-28 bg-surface rounded-2xl animate-pulse" />))}
        </div>
      ) : filteredInvestments?.length ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
          {filteredInvestments.map((investment: any, index: number) => (
            <Link key={investment.id} to={`/investments/${investment.id}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-5 transition-all duration-300 hover:border-border-strong hover:-translate-y-0.5 card-hover"
              style={{ animationDelay: `${index * 30}ms` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-cream/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {investment.return_percentage !== undefined && (
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ backgroundColor: investment.return_percentage >= 0 ? '#7fb069' : '#c76b6b', opacity: 0.6 }} />
              )}
              <div className="relative">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-lg">{categoryIcons[investment.category] || '📦'}</span>
                      <h3 className="text-sm sm:text-base font-semibold text-text-primary group-hover:text-cream transition-colors truncate">
                        {investment.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-medium tracking-wider uppercase px-2 py-1 rounded-full border ${statusConfig[investment.status]?.className || statusConfig.active.className}`}>
                        {statusConfig[investment.status]?.label || investment.status}
                      </span>
                      {investment.city && (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[100px] sm:max-w-none">{investment.city}</span>
                        </span>)}
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 mt-3 text-xs text-text-muted">
                      {investment.land_area_hectares && <span className="font-mono">{investment.land_area_hectares} ha</span>}
                      {investment.document_count !== undefined && <span>{investment.document_count} docs</span>}
                      {investment.purchase_price && <span className="font-mono text-text-muted">Compra: {formatCurrency(investment.purchase_price)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-mono text-base sm:text-lg font-semibold text-cream">
                        {investment.current_value ? formatCurrency(investment.current_value) : '—'}
                      </p>
                      {investment.return_percentage !== undefined && (
                        <p className={`text-xs font-mono flex items-center justify-end gap-1 ${investment.return_percentage >= 0 ? 'text-success' : 'text-error'}`}>
                          {investment.return_percentage >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {investment.return_percentage >= 0 ? '+' : ''}{investment.return_percentage.toFixed(1)}%
                        </p>)}
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-muted group-hover:text-cream transition-colors flex-shrink-0" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface flex items-center justify-center">
            <DollarSign className="h-8 w-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-1">
            {search || category ? 'No se encontraron coincidencias' : 'Aún no hay inversiones'}
          </h3>
          <p className="text-sm text-text-muted mb-6">
            {search || category ? 'Intenta ajustar tu búsqueda o filtros' : 'Comienza agregando tu primera inversión'}
          </p>
          {!(search || category) && (
            <button onClick={() => setShowAddModal(true)} className="glyph-btn glyph-btn-primary">
              <Plus className="h-4 w-4" /> Agregar Inversión
            </button>)}
        </div>
      )}

      <AddInvestmentModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  )
}

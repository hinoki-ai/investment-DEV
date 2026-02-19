import { useMemo } from 'react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import {
  CreditScenario,
  LandOpportunity,
  LandCreditCombo,
  calculateTrueCost,
  generateAmortizationSchedule,
  formatCurrency,
  formatPercent,
  formatCompactNumber,
  formatNumber,
  monthsToYearsMonths
} from '../lib/landCredit'
import { TrendingUp, AlertCircle, CheckCircle, XCircle, Minus } from 'lucide-react'

// Recommendation badge component
function RecommendationBadge({ 
  recommendation, 
  score 
}: { 
  recommendation: string
  score: number 
}) {
  const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    strong_buy: {
      color: 'bg-success-dim text-success border-success/20',
      label: 'STRONG BUY',
      icon: <CheckCircle className="h-3 w-3" />
    },
    buy: {
      color: 'bg-info-dim text-info border-info/20',
      label: 'BUY',
      icon: <CheckCircle className="h-3 w-3" />
    },
    neutral: {
      color: 'bg-surface text-text-muted border-border',
      label: 'NEUTRAL',
      icon: <Minus className="h-3 w-3" />
    },
    avoid: {
      color: 'bg-warning-dim text-warning border-warning/20',
      label: 'AVOID',
      icon: <AlertCircle className="h-3 w-3" />
    },
    strong_avoid: {
      color: 'bg-error-dim text-error border-error/20',
      label: 'STRONG AVOID',
      icon: <XCircle className="h-3 w-3" />
    }
  }

  const { color, label, icon } = config[recommendation] || config.neutral

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold tracking-wider ${color}`}>
      {icon}
      {label}
      <span className="ml-1 opacity-70">{score}</span>
    </div>
  )
}

// Score gauge component
function ScoreGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-lg'
  }

  const getColor = (s: number) => {
    if (s >= 80) return 'var(--success)'
    if (s >= 65) return 'var(--info)'
    if (s >= 45) return 'var(--cream-muted)'
    if (s >= 25) return 'var(--warning)'
    return 'var(--error)'
  }

  const color = getColor(score)
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="50%" cy="50%" r="40%" fill="none" stroke="var(--surface-higher)" strokeWidth="6" />
        <circle
          cx="50%"
          cy="50%"
          r="40%"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

// ============================================================================
// CREDIT TRUTH REVEALER
// ============================================================================

interface CreditTruthRevealerProps {
  credit: CreditScenario
  className?: string
}

export function CreditTruthRevealer({ credit, className = '' }: CreditTruthRevealerProps) {
  const trueCost = useMemo(() => calculateTrueCost(credit), [credit])

  const operationalItems = [
    { label: 'Notary Fees', amount: credit.notaryFees },
    { label: 'CBR Registration', amount: credit.registrationFees },
    { label: 'Appraisal', amount: credit.appraisalFee },
    { label: 'Insurance', amount: credit.insuranceFees },
    { label: 'Stamp Tax (0.8%)', amount: credit.stampTax },
    { label: 'Other fees', amount: credit.otherFees },
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* The Big Lie Revealed */}
      <div className="relative overflow-hidden rounded-2xl border border-error/30 bg-error-dim p-6">
        <div className="relative">
          <h3 className="text-xl font-bold text-error flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            The Credit Truth
          </h3>
          <p className="mt-2 text-text-secondary">
            The bank says "{formatCurrency(credit.advertisedCreditAmount)} credit" 
            but demands {formatCurrency(credit.requiredDownPayment)} down payment.
            <strong className="block mt-2 text-lg text-text-primary">
              In reality you only receive {formatCurrency(trueCost.effectiveCredit)}
            </strong>
          </p>
        </div>
      </div>

      {/* Truth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Credit Amount Comparison */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-3">Credit Amount</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Advertised:</span>
              <span className="font-mono">{formatCurrency(credit.advertisedCreditAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Reality:</span>
              <span className="font-mono text-cream">{formatCurrency(trueCost.effectiveCredit)}</span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between">
                <span className="text-text-muted text-sm">Difference:</span>
                <span className="font-mono text-error">-{formatCurrency(credit.advertisedCreditAmount - trueCost.effectiveCredit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Required */}
        <div className="rounded-2xl border border-warning/20 bg-warning-dim p-5">
          <p className="text-xs font-semibold tracking-widest text-warning uppercase mb-3">Down Payment + Fees</p>
          <p className="font-mono text-2xl font-semibold text-warning">
            {formatCurrency(trueCost.totalCashRequired)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {formatPercent((trueCost.totalCashRequired / credit.advertisedCreditAmount) * 100)} of "credit"
          </p>
        </div>

        {/* Monthly Payment */}
        <div className="rounded-2xl border border-info/20 bg-info-dim p-5">
          <p className="text-xs font-semibold tracking-widest text-info uppercase mb-3">Monthly Payment</p>
          <p className="font-mono text-2xl font-semibold text-info">
            {formatCurrency(trueCost.monthlyPayment)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            For {credit.termYears} years
          </p>
        </div>

        {/* Total Cost */}
        <div className="rounded-2xl border border-cream/10 bg-cream/5 p-5">
          <p className="text-xs font-semibold tracking-widest text-cream uppercase mb-3">Total Credit Cost</p>
          <p className="font-mono text-2xl font-semibold text-cream">
            {formatCurrency(trueCost.totalCreditCost)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            You pay {trueCost.trueCostMultiplier.toFixed(2)}x what you receive
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h4 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-4">Operational Expenses Breakdown</h4>
          <div className="space-y-2">
            {operationalItems.map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-border-subtle last:border-0">
                <span className="text-sm text-text-secondary">{item.label}</span>
                <span className="font-mono text-sm text-text-primary">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-text-primary">Total Operational</span>
              <span className="font-mono font-semibold text-warning">{formatCurrency(trueCost.operationalExpenses)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h4 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-4">Total Credit Cost Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-sm text-text-secondary">Effective Credit Received</span>
              <span className="font-mono text-sm text-success">{formatCurrency(trueCost.effectiveCredit)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-sm text-text-secondary">Total Interest Paid</span>
              <span className="font-mono text-sm text-error">{formatCurrency(trueCost.totalInterestPaid)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-sm text-text-secondary">Total Insurance Paid</span>
              <span className="font-mono text-sm text-warning">{formatCurrency(trueCost.totalInsurancePaid)}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-text-primary">Total Cost</span>
              <span className="font-mono font-semibold text-cream">{formatCurrency(trueCost.totalCreditCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Interest Paid</p>
          <p className="font-mono text-lg font-semibold text-error">{formatCurrency(trueCost.totalInterestPaid)}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Down Payment Opportunity Cost</p>
          <p className="font-mono text-lg font-semibold text-warning">{formatCurrency(trueCost.downPaymentOpportunityCost)}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Payments</p>
          <p className="font-mono text-lg font-semibold text-text-primary">{credit.termYears * 12}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Min. Required Income</p>
          <p className="font-mono text-lg font-semibold text-text-primary">{formatCurrency(credit.requiredMonthlyIncome)}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// AMORTIZATION CHART
// ============================================================================

interface AmortizationChartProps {
  credit: CreditScenario
  monthlyInsurance?: number
  className?: string
}

export function AmortizationChart({ credit, monthlyInsurance = 0, className = '' }: AmortizationChartProps) {
  const data = useMemo(() => {
    const schedule = generateAmortizationSchedule(
      credit.effectiveCreditAmount,
      credit.annualInterestRate,
      credit.termYears,
      monthlyInsurance
    )
    
    return schedule.filter((_, index) => index % 12 === 0 || index === schedule.length - 1).map(p => ({
      year: Math.floor(p.month / 12),
      month: p.month,
      payment: p.payment,
      principal: p.principal,
      interest: p.interest,
      balance: p.remainingBalance
    }))
  }, [credit, monthlyInsurance])

  return (
    <div className={`glass-card p-5 ${className}`}>
      <h3 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        Debt Evolution
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e8d5c4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#e8d5c4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(232, 213, 196, 0.1)" />
            <XAxis 
              dataKey="year" 
              stroke="#8a8279"
              tickFormatter={(value) => `Year ${value}`}
              tick={{ fill: '#8a8279', fontSize: 11 }}
            />
            <YAxis 
              stroke="#8a8279"
              tickFormatter={(value) => formatCompactNumber(value)}
              tick={{ fill: '#8a8279', fontSize: 11 }}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{ 
                backgroundColor: '#111111', 
                border: '1px solid rgba(232, 213, 196, 0.1)',
                borderRadius: '12px'
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="balance"
              name="Remaining Balance"
              stroke="#e8d5c4"
              fillOpacity={1}
              fill="url(#colorBalance)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ============================================================================
// PAYMENT BREAKDOWN CHART
// ============================================================================

interface PaymentBreakdownChartProps {
  credit: CreditScenario
  className?: string
}

export function PaymentBreakdownChart({ credit, className = '' }: PaymentBreakdownChartProps) {
  const data = useMemo(() => {
    const trueCost = calculateTrueCost(credit)
    return [
      { name: 'Principal', value: trueCost.effectiveCredit, color: '#7fb069' },
      { name: 'Interest', value: trueCost.totalInterestPaid, color: '#c76b6b' },
      { name: 'Insurance', value: trueCost.totalInsurancePaid, color: '#d4a373' },
    ]
  }, [credit])

  return (
    <div className={`glass-card p-5 ${className}`}>
      <h3 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-4">Total Cost Composition</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ 
                backgroundColor: '#111111', 
                border: '1px solid rgba(232, 213, 196, 0.1)',
                borderRadius: '12px'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-text-secondary">{item.name}</span>
            </div>
            <span className="font-mono font-medium text-text-primary">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// LAND CREDIT COMBO CARD
// ============================================================================

interface LandCreditComboCardProps {
  combo: LandCreditCombo
  isBest?: boolean
  className?: string
}

export function LandCreditComboCard({ combo, isBest = false, className = '' }: LandCreditComboCardProps) {
  const { land, credit, analysis } = combo

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
      isBest 
        ? 'border-success/30 bg-success-dim' 
        : 'border-border bg-surface hover:border-border-strong'
    } ${className}`}>
      {isBest && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success text-void text-xs font-semibold">
            <TrendingUp className="h-3 w-3" />
            BEST
          </span>
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-text-primary truncate">{land.name}</h3>
          <p className="text-sm text-text-muted">
            {land.location.commune}, {land.location.region}
          </p>
          <p className="text-sm text-text-muted mt-1">
            with {credit.name} ({credit.bank})
          </p>
        </div>
        <ScoreGauge score={analysis.score} size="sm" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Land Price</p>
          <p className="font-mono font-semibold text-text-primary">{formatCurrency(land.askingPrice)}</p>
          {land.belowAppraisalBy > 0 && (
            <p className="text-xs text-success mt-1">
              {land.belowAppraisalBy}% below appraisal
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Monthly Payment</p>
          <p className="font-mono font-semibold text-text-primary">{formatCurrency(analysis.monthlyPayment)}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Cash Required</p>
          <p className="font-mono font-semibold text-text-primary">{formatCurrency(analysis.cashRequired)}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">5-Year ROI</p>
          <p className={`font-mono font-semibold ${analysis.roi5Year > 0 ? 'text-success' : 'text-error'}`}>
            {analysis.roi5Year > 0 ? '+' : ''}{formatPercent(analysis.roi5Year)}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border-subtle">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <RecommendationBadge recommendation={analysis.recommendation} score={analysis.score} />
          <span className="text-xs text-text-muted">
            Break-even in {monthsToYearsMonths(analysis.breakEvenMonth)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPARISON TABLE
// ============================================================================

interface ComparisonTableProps {
  combos: LandCreditCombo[]
  className?: string
}

export function ComparisonTable({ combos, className = '' }: ComparisonTableProps) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-cream-muted uppercase">Land + Credit</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-cream-muted uppercase">Price</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-cream-muted uppercase">Cash Req.</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-cream-muted uppercase">Monthly</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-cream-muted uppercase">ROI 5Y</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-cream-muted uppercase">ROI 10Y</th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold tracking-widest text-cream-muted uppercase">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {combos.map((combo) => (
              <tr key={`${combo.land.id}-${combo.credit.id}`} className="hover:bg-surface-elevated/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-text-primary">{combo.land.name}</div>
                  <div className="text-xs text-text-muted">{combo.credit.bank}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                  {formatCurrency(combo.land.askingPrice)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCurrency(combo.analysis.cashRequired)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCurrency(combo.analysis.monthlyPayment)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={combo.analysis.roi5Year > 0 ? 'text-success' : 'text-error'}>
                    {combo.analysis.roi5Year > 0 ? '+' : ''}{formatPercent(combo.analysis.roi5Year)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={combo.analysis.roi10Year > 0 ? 'text-success' : 'text-error'}>
                    {combo.analysis.roi10Year > 0 ? '+' : ''}{formatPercent(combo.analysis.roi10Year)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                    combo.analysis.score >= 80 ? 'bg-success-dim text-success' :
                    combo.analysis.score >= 60 ? 'bg-info-dim text-info' :
                    combo.analysis.score >= 40 ? 'bg-surface text-text-muted' :
                    'bg-error-dim text-error'
                  }`}>
                    {combo.analysis.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// LAND CARD
// ============================================================================

interface LandCardProps {
  land: LandOpportunity
  isSelected?: boolean
  onClick?: () => void
  className?: string
}

export function LandCard({ land, isSelected = false, onClick, className = '' }: LandCardProps) {
  const zoningConfig: Record<string, { color: string; label: string }> = {
    residential: { color: 'bg-info-dim text-info border-info/20', label: 'Residential' },
    commercial: { color: 'bg-cream/5 text-cream border-cream/20', label: 'Commercial' },
    industrial: { color: 'bg-warning-dim text-warning border-warning/20', label: 'Industrial' },
    agricultural: { color: 'bg-success-dim text-success border-success/20', label: 'Agricultural' },
    mixed: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Mixed' },
    undefined: { color: 'bg-surface text-text-muted border-border', label: 'Undefined' }
  }

  const zoning = zoningConfig[land.zoning] || zoningConfig.undefined

  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border p-4 cursor-pointer transition-all duration-200 card-hover
        ${isSelected ? 'border-cream bg-cream/5 ring-1 ring-cream/20' : 'border-border bg-surface hover:border-border-strong'}
        ${className}
      `}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-text-primary truncate">{land.name}</h4>
          <p className="text-sm text-text-muted">{land.location.commune}</p>
        </div>
        <span className={`flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-medium border ${zoning.color}`}>
          {zoning.label}
        </span>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-text-muted text-xs">Price:</span>
          <span className="ml-1 font-mono font-medium text-text-primary">{formatCurrency(land.askingPrice)}</span>
        </div>
        <div>
          <span className="text-text-muted text-xs">Area:</span>
          <span className="ml-1 font-mono font-medium text-text-primary">{formatNumber(land.landAreaSquareMeters)} m²</span>
        </div>
      </div>

      {land.belowAppraisalBy > 0 && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs text-success bg-success-dim px-2 py-1 rounded-lg border border-success/20">
          <TrendingUp className="h-3 w-3" />
          {land.belowAppraisalBy}% below appraisal
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {land.hasBasicServices && (
          <span className="text-[10px] bg-surface-elevated text-text-secondary px-2 py-0.5 rounded border border-border">Utilities</span>
        )}
        {land.hasRoadAccess && (
          <span className="text-[10px] bg-surface-elevated text-text-secondary px-2 py-0.5 rounded border border-border">Road Access</span>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// CREDIT CARD
// ============================================================================

interface CreditCardProps {
  credit: CreditScenario
  isSelected?: boolean
  onClick?: () => void
  className?: string
}

export function CreditCard({ credit, isSelected = false, onClick, className = '' }: CreditCardProps) {
  const monthlyPayment = useMemo(() => {
    const schedule = generateAmortizationSchedule(
      credit.effectiveCreditAmount,
      credit.annualInterestRate,
      credit.termYears
    )
    return schedule[0]?.payment || 0
  }, [credit])

  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border p-4 cursor-pointer transition-all duration-200 card-hover
        ${isSelected ? 'border-cream bg-cream/5 ring-1 ring-cream/20' : 'border-border bg-surface hover:border-border-strong'}
        ${className}
      `}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-text-primary">{credit.name}</h4>
          <p className="text-sm text-text-muted">{credit.bank}</p>
        </div>
      </div>
      
      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Rate:</span>
          <span className="font-mono font-medium text-text-primary">{credit.annualInterestRate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Term:</span>
          <span className="font-mono font-medium text-text-primary">{credit.termYears} years</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Effective credit:</span>
          <span className="font-mono font-medium text-warning">{formatCurrency(credit.effectiveCreditAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Payment:</span>
          <span className="font-mono font-medium text-text-primary">{formatCurrency(monthlyPayment)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border-subtle">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted text-xs">Down payment:</span>
          <span className="font-mono font-bold text-error">{formatCurrency(credit.requiredDownPayment)}</span>
        </div>
      </div>
    </div>
  )
}

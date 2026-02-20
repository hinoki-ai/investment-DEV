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
  Area,
  BarChart,
  Bar,
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
  monthsToYearsMonths,
  CURRENT_UF_VALUE,
  getScoreColor
} from '../lib/landCredit'
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Minus,
  Calculator,
  Percent,
  DollarSign,
  Building2,
  Info,
  Target,
  Award,
  Scale
} from 'lucide-react'
import { HelpTooltip, INVESTMENT_TOOLTIPS } from './HelpTooltip'

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

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
      label: 'COMPRA FUERTE',
      icon: <CheckCircle className="h-3 w-3" />
    },
    buy: {
      color: 'bg-info-dim text-info border-info/20',
      label: 'COMPRA',
      icon: <CheckCircle className="h-3 w-3" />
    },
    neutral: {
      color: 'bg-surface text-text-muted border-border',
      label: 'NEUTRAL',
      icon: <Minus className="h-3 w-3" />
    },
    avoid: {
      color: 'bg-warning-dim text-warning border-warning/20',
      label: 'EVITAR',
      icon: <AlertCircle className="h-3 w-3" />
    },
    strong_avoid: {
      color: 'bg-error-dim text-error border-error/20',
      label: 'EVITAR FUERTE',
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
function ScoreGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-28 h-28 text-xl'
  }

  const color = getScoreColor(score)
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

// Metric card component
function MetricCard({ 
  label, 
  value, 
  subtext,
  icon: Icon,
  color = 'cream',
  highlight = false,
  tooltip
}: { 
  label: string
  value: string
  subtext?: string
  icon: React.ElementType
  color?: 'cream' | 'success' | 'error' | 'warning' | 'info'
  highlight?: boolean
  tooltip?: { title?: string; content: string; example?: string }
}) {
  const colorClasses = {
    cream: 'text-cream',
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-info'
  }
  
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-cream/5 border border-cream/10' : 'bg-surface border border-border'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
        {tooltip && (
          <HelpTooltip title={tooltip.title || label} content={tooltip.content} example={tooltip.example} size="sm" />
        )}
      </div>
      <p className={`text-xl font-bold ${colorClasses[color]}`}>{value}</p>
      {subtext && <p className="text-xs text-text-muted mt-1">{subtext}</p>}
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
    { label: 'Tasación', amount: credit.appraisalFee },
    { label: 'Estudio de Títulos', amount: credit.registrationFees },
    { label: 'Gastos Notariales', amount: credit.notaryFees },
    { label: 'Seguros', amount: credit.insuranceFees },
    { label: `Impuesto al Mutuo (${credit.isDFL2 ? '0.2%' : '0.8%'})`, amount: credit.stampTax },
    { label: 'Otros gastos', amount: credit.otherFees },
  ]

  const savingsFromDFL2 = credit.isDFL2 
    ? (credit.effectiveCreditAmount * 0.006) // 0.8% - 0.2% = 0.6% savings
    : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* The Big Lie Revealed */}
      <div className="relative overflow-hidden rounded-2xl border border-error/30 bg-error-dim p-6">
        <div className="relative">
          <h3 className="text-xl font-bold text-error flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            La Verdad del Crédito
          </h3>
          <p className="mt-2 text-text-secondary">
            El banco dice "{formatCurrency(credit.advertisedCreditAmount)} de crédito" 
            pero exige {formatCurrency(credit.requiredDownPayment)} de pie.
            <strong className="block mt-2 text-lg text-text-primary">
              En realidad solo recibes {formatCurrency(trueCost.effectiveCredit)}
            </strong>
          </p>
          {credit.isDFL2 && (
            <div className="mt-3 p-3 bg-success-dim border border-success/20 rounded-lg">
              <p className="text-sm text-success">
                <CheckCircle className="h-4 w-4 inline mr-1" />
                <strong>Ahorro DFL2:</strong> {formatCurrency(savingsFromDFL2)} en impuestos
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Truth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Credit Amount Comparison */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-3 flex items-center gap-1">
            Monto del Crédito
            <HelpTooltip title="Credit Amount" content="La diferencia entre lo que el banco publicita vs. lo que realmente recibes después del pie y fees." example='Banco dice "$100M crédito" pero recibes solo $75M efectivo.' size="sm" />
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Publicitado:</span>
              <span className="font-mono">{formatCurrency(credit.advertisedCreditAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Real (Effective Credit):</span>
              <span className="font-mono text-cream">{formatCurrency(trueCost.effectiveCredit)}</span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between">
                <span className="text-text-muted text-sm">Diferencia:</span>
                <span className="font-mono text-error">-{formatCurrency(credit.advertisedCreditAmount - trueCost.effectiveCredit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Required */}
        <div className="rounded-2xl border border-warning/20 bg-warning-dim p-5">
          <p className="text-xs font-semibold tracking-widest text-warning uppercase mb-3 flex items-center gap-1">
            Pie + Gastos (Cash Required)
            <HelpTooltip title="Cash Required" content={INVESTMENT_TOOLTIPS.cashRequired.content} example={INVESTMENT_TOOLTIPS.cashRequired.example} size="sm" />
          </p>
          <p className="font-mono text-2xl font-semibold text-warning">
            {formatCurrency(trueCost.totalCashRequired)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {formatPercent((trueCost.totalCashRequired / credit.advertisedCreditAmount) * 100)} del "crédito" publicitado
          </p>
        </div>

        {/* Monthly Payment */}
        <div className="rounded-2xl border border-info/20 bg-info-dim p-5">
          <p className="text-xs font-semibold tracking-widest text-info uppercase mb-3 flex items-center gap-1">
            Dividendo Mensual
            <HelpTooltip title="Monthly Payment" content={INVESTMENT_TOOLTIPS.monthlyPayment.content} example={INVESTMENT_TOOLTIPS.monthlyPayment.example} size="sm" />
          </p>
          <p className="font-mono text-2xl font-semibold text-info">
            {formatCurrency(trueCost.monthlyPayment)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Por {credit.termYears} años ({credit.termYears * 12} pagos)
          </p>
        </div>

        {/* Total Cost */}
        <div className="rounded-2xl border border-cream/10 bg-cream/5 p-5">
          <p className="text-xs font-semibold tracking-widest text-cream uppercase mb-3 flex items-center gap-1">
            Costo Total (True Cost)
            <HelpTooltip title="True Cost" content={INVESTMENT_TOOLTIPS.trueCost.content} example={INVESTMENT_TOOLTIPS.trueCost.example} size="sm" />
          </p>
          <p className="font-mono text-2xl font-semibold text-cream">
            {formatCurrency(trueCost.totalCreditCost)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Pagas {trueCost.trueCostMultiplier.toFixed(2)}x lo recibido
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h4 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-4">Desglose Gastos Operacionales</h4>
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
              <span className="text-sm font-semibold text-text-primary">Total Operacional</span>
              <span className="font-mono font-semibold text-warning">{formatCurrency(trueCost.operationalExpenses)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h4 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-4">Desglose Costo Total</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-sm text-text-secondary">Crédito Efectivo Recibido</span>
              <span className="font-mono text-sm text-success">{formatCurrency(trueCost.effectiveCredit)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-sm text-text-secondary">Intereses Totales Pagados</span>
              <span className="font-mono text-sm text-error">{formatCurrency(trueCost.totalInterestPaid)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-sm text-text-secondary">Seguros Totales</span>
              <span className="font-mono text-sm text-warning">{formatCurrency(trueCost.totalInsurancePaid)}</span>
            </div>
            {trueCost.estimatedTaxBenefit > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-sm text-text-secondary">Beneficio Tributario Anual (est.)</span>
                <span className="font-mono text-sm text-success">-{formatCurrency(trueCost.estimatedTaxBenefit)}</span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-text-primary">Costo Total</span>
              <span className="font-mono font-semibold text-cream">{formatCurrency(trueCost.totalCreditCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Intereses Pagados</p>
          <p className="font-mono text-lg font-semibold text-error">{formatCurrency(trueCost.totalInterestPaid)}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Costo Oportunidad del Pie</p>
          <p className="font-mono text-lg font-semibold text-warning">{formatCurrency(trueCost.downPaymentOpportunityCost)}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total de Pagos</p>
          <p className="font-mono text-lg font-semibold text-text-primary">{credit.termYears * 12}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Renta Mínima Requerida</p>
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
      balance: p.remainingBalance,
      cumulativeInterest: p.cumulativeInterest
    }))
  }, [credit, monthlyInsurance])

  return (
    <div className={`glass-card p-5 ${className}`}>
      <h3 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        Evolución de la Deuda
      </h3>
      <div className="h-64 sm:h-80">
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
              tickFormatter={(value) => `Año ${value}`}
              tick={{ fill: '#8a8279', fontSize: 11 }}
            />
            <YAxis 
              stroke="#8a8279"
              tickFormatter={(value) => formatCompactNumber(value)}
              tick={{ fill: '#8a8279', fontSize: 11 }}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Año ${label}`}
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
              name="Saldo Pendiente"
              stroke="#e8d5c4"
              fillOpacity={1}
              fill="url(#colorBalance)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="cumulativeInterest"
              name="Intereses Acumulados"
              stroke="#c76b6b"
              fill="#c76b6b"
              fillOpacity={0.2}
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
      { name: 'Capital', value: trueCost.effectiveCredit, color: '#7fb069' },
      { name: 'Intereses', value: trueCost.totalInterestPaid, color: '#c76b6b' },
      { name: 'Seguros', value: trueCost.totalInsurancePaid, color: '#d4a373' },
    ]
  }, [credit])

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className={`glass-card p-5 ${className}`}>
      <h3 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-4">Composición del Costo Total</h3>
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                `${name} (${((value / total) * 100).toFixed(1)}%)`
              ]}
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
            <div className="text-right">
              <span className="font-mono font-medium text-text-primary">{formatCurrency(item.value)}</span>
              <span className="text-xs text-text-muted ml-2">({((item.value / total) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// ADVANCED METRICS DASHBOARD
// ============================================================================

interface AdvancedMetricsDashboardProps {
  combo: LandCreditCombo
  className?: string
}

export function AdvancedMetricsDashboard({ combo, className = '' }: AdvancedMetricsDashboardProps) {
  const { analysis } = combo
  const { advancedMetrics, taxAnalysis } = analysis

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Score */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex items-center gap-4">
          <ScoreGauge score={analysis.score} size="xl" />
          <div>
            <RecommendationBadge recommendation={analysis.recommendation} score={analysis.score} />
            <p className="text-sm text-text-muted mt-2">
              Punto de equilibrio: {monthsToYearsMonths(analysis.breakEvenMonth)}
            </p>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="ROI 5 Años"
            value={formatPercent(analysis.roi5Year)}
            subtext="Anualizado"
            icon={TrendingUp}
            color={analysis.roi5Year > 8 ? 'success' : analysis.roi5Year > 4 ? 'cream' : 'warning'}
          />
          <MetricCard
            label="Cash-on-Cash"
            value={formatPercent(advancedMetrics.cashOnCashReturn)}
            subtext="Retorno anual sobre efectivo invertido"
            icon={DollarSign}
            color={advancedMetrics.cashOnCashReturn > 10 ? 'success' : advancedMetrics.cashOnCashReturn > 5 ? 'cream' : 'warning'}
            tooltip={INVESTMENT_TOOLTIPS.cashOnCash}
          />
          <MetricCard
            label="IRR"
            value={formatPercent(advancedMetrics.irr)}
            subtext="Tasa interna de retorno"
            icon={Percent}
            color={advancedMetrics.irr > 15 ? 'success' : advancedMetrics.irr > 10 ? 'cream' : 'warning'}
            tooltip={INVESTMENT_TOOLTIPS.irr}
          />
          <MetricCard
            label="Cap Rate"
            value={formatPercent(advancedMetrics.capRate)}
            subtext="Tasa de capitalización"
            icon={Building2}
            color={advancedMetrics.capRate > 5 ? 'success' : advancedMetrics.capRate > 3 ? 'cream' : 'warning'}
            tooltip={INVESTMENT_TOOLTIPS.capRate}
          />
        </div>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Leverage Metrics */}
        <div className="glass-card p-4">
          <h4 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-3 flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Apalancamiento (Leverage)
            <HelpTooltip title="Leverage" content="Qué tanto usas deuda para financiar la inversión. Más apalancamiento = más riesgo pero también más retorno potencial sobre tu efectivo." example="20% pie = 5x apalancamiento. Si sube 10%, tú ganas 50% sobre tu efectivo." size="sm" />
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary flex items-center gap-1">
                LTV (Loan-to-Value)
                <HelpTooltip title="LTV" content={INVESTMENT_TOOLTIPS.ltv.content} example={INVESTMENT_TOOLTIPS.ltv.example} size="sm" />
              </span>
              <span className={`font-mono ${advancedMetrics.loanToValue > 80 ? 'text-error' : 'text-text-primary'}`}>
                {advancedMetrics.loanToValue.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary flex items-center gap-1">
                DSCR
                <HelpTooltip title="DSCR" content={INVESTMENT_TOOLTIPS.dscr.content} example={INVESTMENT_TOOLTIPS.dscr.example} size="sm" />
              </span>
              <span className={`font-mono ${advancedMetrics.dscr < 1.25 ? 'text-warning' : 'text-success'}`}>
                {advancedMetrics.dscr.toFixed(2)}x
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary flex items-center gap-1">
                Equity Multiple
                <HelpTooltip title="Equity Multiple" content={INVESTMENT_TOOLTIPS.equityMultiple.content} example={INVESTMENT_TOOLTIPS.equityMultiple.example} size="sm" />
              </span>
              <span className="font-mono text-text-primary">{advancedMetrics.equityMultiple.toFixed(2)}x</span>
            </div>
            <div className="text-xs text-text-muted mt-2 pt-2 border-t border-border">
              DSCR {'>'} 1.25 es saludable. LTV {'<'} 80% es conservador.
            </div>
          </div>
        </div>

        {/* Return Metrics */}
        <div className="glass-card p-4">
          <h4 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Retornos Proyectados
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">ROI 5 años</span>
              <span className="font-mono text-text-primary">{formatPercent(analysis.roi5Year)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">ROI 10 años</span>
              <span className="font-mono text-text-primary">{formatPercent(analysis.roi10Year)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">ROI 20 años</span>
              <span className="font-mono text-text-primary">{formatPercent(analysis.roi20Year)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-sm text-text-secondary">Payback Period</span>
              <span className="font-mono text-cream">{advancedMetrics.paybackPeriod.toFixed(1)} años</span>
            </div>
          </div>
        </div>

        {/* Tax Benefits */}
        <div className="glass-card p-4">
          <h4 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" />
            Beneficios Tributarios
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">DFL2 Aplicable</span>
              <span className={`font-mono ${taxAnalysis.isDFL2Eligible ? 'text-success' : 'text-text-muted'}`}>
                {taxAnalysis.isDFL2Eligible ? 'SÍ' : 'NO'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">Ahorro anual (est.)</span>
              <span className="font-mono text-success">
                {formatCurrency(taxAnalysis.estimatedAnnualTaxBenefit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">Beneficio total</span>
              <span className="font-mono text-success">
                {formatCurrency(taxAnalysis.lifetimeTaxBenefit)}
              </span>
            </div>
            <div className="text-xs text-text-muted mt-2 pt-2 border-t border-border">
              Máxima deducción: {formatCurrency(taxAnalysis.maxInterestDeduction)}
            </div>
          </div>
        </div>
      </div>

      {/* Appreciation Projection */}
      {analysis.appreciationValue5Year > 0 && (
        <div className="glass-card p-5">
          <h4 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Proyección de Plusvalía
          </h4>
          <div className="h-40 sm:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { year: 'Año 0', value: combo.land.askingPrice, label: 'Compra' },
                { year: 'Año 5', value: analysis.appreciationValue5Year, label: formatPercent(analysis.roi5Year) },
                { year: 'Año 10', value: analysis.appreciationValue10Year, label: formatPercent(analysis.roi10Year) },
                { year: 'Año 20', value: analysis.appreciationValue20Year, label: formatPercent(analysis.roi20Year) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(232, 213, 196, 0.1)" />
                <XAxis dataKey="year" stroke="#8a8279" tick={{ fill: '#8a8279', fontSize: 11 }} />
                <YAxis 
                  stroke="#8a8279"
                  tickFormatter={(value) => formatCompactNumber(value)}
                  tick={{ fill: '#8a8279', fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: '#111111', 
                    border: '1px solid rgba(232, 213, 196, 0.1)',
                    borderRadius: '12px'
                  }}
                />
                <Bar dataKey="value" fill="#7fb069" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Residual Land Value (if applicable) */}
      {analysis.residualValue && analysis.residualValue.residualLandValue > 0 && (
        <div className="glass-card p-4 border border-info/20">
          <h4 className="text-xs font-semibold tracking-widest text-info uppercase mb-3 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Valor Residual del Terreno (Desarrollo)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-text-muted">GDV Estimado</p>
              <p className="font-mono text-text-primary">{formatCurrency(analysis.residualValue.grossDevelopmentValue)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Costos Desarrollo</p>
              <p className="font-mono text-text-primary">{formatCurrency(analysis.residualValue.totalDevelopmentCosts)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Valor Residual</p>
              <p className={`font-mono ${analysis.residualValue.residualLandValue > combo.land.askingPrice ? 'text-success' : 'text-warning'}`}>
                {formatCurrency(analysis.residualValue.residualLandValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">VLR por m²</p>
              <p className="font-mono text-text-primary">
                {formatCurrency(analysis.residualValue.landValuePerSquareMeter)}
              </p>
            </div>
          </div>
          {analysis.residualValue.residualLandValue > combo.land.askingPrice && (
            <p className="text-xs text-success mt-3">
              <CheckCircle className="h-3 w-3 inline mr-1" />
              El terreno está {formatCurrency(analysis.residualValue.residualLandValue - combo.land.askingPrice)} 
              {' '}por debajo de su valor residual. ¡Oportunidad de desarrollo!
            </p>
          )}
        </div>
      )}
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
            MEJOR
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
            con {credit.name} ({credit.bank})
          </p>
        </div>
        <ScoreGauge score={analysis.score} size="sm" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Precio Terreno</p>
          <p className="font-mono font-semibold text-text-primary">{formatCurrency(land.askingPrice)}</p>
          {land.belowAppraisalBy > 0 && (
            <p className="text-xs text-success mt-1">
              {land.belowAppraisalBy}% bajo tasación
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Dividendo</p>
          <p className="font-mono font-semibold text-text-primary">{formatCurrency(analysis.monthlyPayment)}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Efectivo Req.</p>
          <p className="font-mono font-semibold text-text-primary">{formatCurrency(analysis.cashRequired)}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">ROI 5 Años</p>
          <p className={`font-mono font-semibold ${analysis.roi5Year > 0 ? 'text-success' : 'text-error'}`}>
            {analysis.roi5Year > 0 ? '+' : ''}{formatPercent(analysis.roi5Year)}
          </p>
        </div>
      </div>

      {/* Advanced Metrics Preview */}
      <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-text-muted uppercase">IRR</p>
          <p className="text-sm font-mono text-cream">{formatPercent(analysis.advancedMetrics.irr)}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase">Cap Rate</p>
          <p className="text-sm font-mono text-cream">{formatPercent(analysis.advancedMetrics.capRate)}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase">DSCR</p>
          <p className={`text-sm font-mono ${analysis.advancedMetrics.dscr >= 1.25 ? 'text-success' : 'text-warning'}`}>
            {analysis.advancedMetrics.dscr.toFixed(2)}x
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border-subtle">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <RecommendationBadge recommendation={analysis.recommendation} score={analysis.score} />
          <span className="text-xs text-text-muted">
            Equilibrio en {monthsToYearsMonths(analysis.breakEvenMonth)}
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
              <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-cream-muted uppercase">Terreno + Crédito</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-cream-muted uppercase">Precio</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-cream-muted uppercase">Efectivo</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-cream-muted uppercase">Dividendo</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-cream-muted uppercase">ROI 5Y</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-cream-muted uppercase">IRR</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-cream-muted uppercase">Cap Rate</th>
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
                <td className="px-4 py-3 text-right font-mono text-cream">
                  {formatPercent(combo.analysis.advancedMetrics.irr)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-cream">
                  {formatPercent(combo.analysis.advancedMetrics.capRate)}
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
    residential: { color: 'bg-info-dim text-info border-info/20', label: 'Residencial' },
    commercial: { color: 'bg-cream/5 text-cream border-cream/20', label: 'Comercial' },
    industrial: { color: 'bg-warning-dim text-warning border-warning/20', label: 'Industrial' },
    agricultural: { color: 'bg-success-dim text-success border-success/20', label: 'Agrícola' },
    mixed: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Mixto' },
    undefined: { color: 'bg-surface text-text-muted border-border', label: 'Indefinido' }
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
          <span className="text-text-muted text-xs">Precio:</span>
          <span className="ml-1 font-mono font-medium text-text-primary">{formatCurrency(land.askingPrice)}</span>
        </div>
        <div>
          <span className="text-text-muted text-xs">Superficie:</span>
          <span className="ml-1 font-mono font-medium text-text-primary">{formatNumber(land.landAreaSquareMeters)} m²</span>
        </div>
      </div>

      {land.belowAppraisalBy > 0 && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs text-success bg-success-dim px-2 py-1 rounded-lg border border-success/20">
          <TrendingUp className="h-3 w-3" />
          {land.belowAppraisalBy}% bajo tasación
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {land.hasBasicServices && (
          <span className="text-[10px] bg-surface-elevated text-text-secondary px-2 py-0.5 rounded border border-border">Servicios</span>
        )}
        {land.hasRoadAccess && (
          <span className="text-[10px] bg-surface-elevated text-text-secondary px-2 py-0.5 rounded border border-border">Acceso</span>
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

  const trueCost = useMemo(() => calculateTrueCost(credit), [credit])

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
          {credit.isDFL2 && (
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-success bg-success-dim px-2 py-0.5 rounded border border-success/20">
              <Award className="h-3 w-3" />
              DFL2
            </span>
          )}
        </div>
      </div>
      
      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Tasa:</span>
          <span className="font-mono font-medium text-text-primary">{credit.annualInterestRate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Plazo:</span>
          <span className="font-mono font-medium text-text-primary">{credit.termYears} años</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Crédito efectivo:</span>
          <span className="font-mono font-medium text-warning">{formatCurrency(credit.effectiveCreditAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Dividendo:</span>
          <span className="font-mono font-medium text-text-primary">{formatCurrency(monthlyPayment)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border-subtle">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted text-xs">Pie requerido:</span>
          <span className="font-mono font-bold text-error">{formatCurrency(credit.requiredDownPayment)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-text-muted text-xs">Costo total:</span>
          <span className="font-mono text-cream">{formatCurrency(trueCost.totalCreditCost)}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MARKET DATA PANEL
// ============================================================================

export function MarketDataPanel({ className = '' }: { className?: string }) {
  return (
    <div className={`glass-card p-5 ${className}`}>
      <h3 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-4 flex items-center gap-2">
        <Info className="h-4 w-4" />
        Datos de Mercado Chile 2025-2026
      </h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-2">Valor UF (Feb 2026)</h4>
          <p className="text-2xl font-mono text-cream">{formatCurrency(CURRENT_UF_VALUE)}</p>
          <p className="text-xs text-text-muted">Actualizado por Banco Central</p>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium text-text-primary mb-2">Tasas Hipotecarias</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Mejor tasa (Itaú)</span>
              <span className="font-mono text-success">3.39%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">BancoEstado</span>
              <span className="font-mono text-text-primary">4.19%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Promedio mercado</span>
              <span className="font-mono text-text-primary">4.80%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Máxima (Santander)</span>
              <span className="font-mono text-error">5.99%</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium text-text-primary mb-2">Gastos Operacionales (aprox.)</h4>
          <div className="space-y-1 text-xs text-text-secondary">
            <p>• Tasación: UF 2.5 ({formatCurrency(100000)})</p>
            <p>• Estudio títulos: UF 2.5-10</p>
            <p>• Gastos notariales: UF 2.5-5</p>
            <p>• Inscripción CBR: ~0.7% del valor</p>
            <p>• Impuesto mutuo: 0.8% (0.2% DFL2)</p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium text-text-primary mb-2">Plusvalía Histórica Anual</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">Santiago</span>
              <span className="font-mono">3.5% - 8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Concepción</span>
              <span className="font-mono">3% - 7%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Valparaíso</span>
              <span className="font-mono">2.5% - 6.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Rural</span>
              <span className="font-mono">2% - 5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

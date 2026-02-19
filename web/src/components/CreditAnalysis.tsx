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
import { TrendingUp, AlertCircle } from 'lucide-react'
import { TruthCard, CostBreakdownCard, RecommendationBadge, ScoreGauge } from './MoneyCard'

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
    { label: 'Gastos Notariales', amount: credit.notaryFees },
    { label: 'Inscripción CBR', amount: credit.registrationFees },
    { label: 'Tasación', amount: credit.appraisalFee },
    { label: 'Seguros', amount: credit.insuranceFees },
    { label: 'Impuesto al Mutuo (0.8%)', amount: credit.stampTax },
    { label: 'Otros gastos', amount: credit.otherFees },
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* The Big Lie Revealed */}
      <div className="bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <AlertCircle className="h-6 w-6" />
          La Verdad del Crédito
        </h3>
        <p className="mt-2 opacity-90">
          El banco dice "{formatCurrency(credit.advertisedCreditAmount)} de crédito" 
          pero te exige {formatCurrency(credit.requiredDownPayment)} de pie.
          <strong className="block mt-2 text-lg">
            En realidad solo recibes {formatCurrency(trueCost.effectiveCredit)}
          </strong>
        </p>
      </div>

      {/* Truth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TruthCard
          label="Monto del Crédito"
          advertised={credit.advertisedCreditAmount}
          reality={trueCost.effectiveCredit}
        />
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-medium text-gray-600">Pie + Gastos (Cash necesario)</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {formatCurrency(trueCost.totalCashRequired)}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            {formatPercent((trueCost.totalCashRequired / credit.advertisedCreditAmount) * 100)} del "crédito"
          </p>
        </div>
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
          <p className="text-sm font-medium text-gray-600">Dividendo Mensual</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {formatCurrency(trueCost.monthlyPayment)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Durante {credit.termYears} años
          </p>
        </div>
        <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-5">
          <p className="text-sm font-medium text-gray-600">Costo Total del Crédito</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">
            {formatCurrency(trueCost.totalCreditCost)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            Pagas {trueCost.trueCostMultiplier.toFixed(2)}x lo que recibes
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostBreakdownCard
          title="Desglose de Gastos Operacionales"
          items={operationalItems}
          total={trueCost.operationalExpenses}
        />
        <CostBreakdownCard
          title="Desglose Total del Crédito"
          items={[
            { label: 'Crédito Efectivo Recibido', amount: trueCost.effectiveCredit },
            { label: 'Intereses Totales', amount: trueCost.totalInterestPaid, highlight: true },
            { label: 'Seguros Totales', amount: trueCost.totalInsurancePaid },
          ]}
          total={trueCost.totalCreditCost}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-sm text-gray-500">Intereses Pagados</p>
          <p className="text-xl font-bold text-rose-600">{formatCurrency(trueCost.totalInterestPaid)}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-sm text-gray-500">Costo de Oportunidad del Pie</p>
          <p className="text-xl font-bold text-amber-600">{formatCurrency(trueCost.downPaymentOpportunityCost)}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-sm text-gray-500">Pagos Totales</p>
          <p className="text-xl font-bold text-gray-800">{credit.termYears * 12}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-sm text-gray-500">Renta Mínima Requerida</p>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(credit.requiredMonthlyIncome)}</p>
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
    
    // Sample data points (every 12 months to avoid too many points)
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
    <div className={`bg-white rounded-xl border p-5 ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary-500" />
        Evolución de la Deuda
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="year" 
              stroke="#6b7280"
              tickFormatter={(value) => `Año ${value}`}
            />
            <YAxis 
              stroke="#6b7280"
              tickFormatter={(value) => formatCompactNumber(value)}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Año ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="balance"
              name="Saldo Pendiente"
              stroke="#8b5cf6"
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
      { name: 'Capital', value: trueCost.effectiveCredit, color: '#10b981' },
      { name: 'Intereses', value: trueCost.totalInterestPaid, color: '#f43f5e' },
      { name: 'Seguros', value: trueCost.totalInsurancePaid, color: '#f59e0b' },
    ]
  }, [credit])

  return (
    <div className={`bg-white rounded-xl border p-5 ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-4">Composición del Costo Total</h3>
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
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
            <span className="font-medium">{formatCurrency(item.value)}</span>
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
    <div className={`rounded-xl border-2 p-5 ${isBest ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'} ${className}`}>
      {isBest && (
        <div className="mb-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-500 text-white text-sm font-semibold">
          <TrendingUp className="h-4 w-4" />
          MEJOR OPCIÓN
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{land.name}</h3>
          <p className="text-sm text-gray-500">
            {land.location.commune}, {land.location.region}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            con {credit.name} ({credit.bank})
          </p>
        </div>
        <ScoreGauge score={analysis.score} size="sm" showLabel={false} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Precio del Terreno</p>
          <p className="font-semibold">{formatCurrency(land.askingPrice)}</p>
          {land.belowAppraisalBy > 0 && (
            <p className="text-xs text-emerald-600">
              {land.belowAppraisalBy}% bajo tasación
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500">Dividendo Mensual</p>
          <p className="font-semibold">{formatCurrency(analysis.monthlyPayment)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Cash Necesario</p>
          <p className="font-semibold">{formatCurrency(analysis.cashRequired)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">ROI a 5 años</p>
          <p className={`font-semibold ${analysis.roi5Year > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {analysis.roi5Year > 0 ? '+' : ''}{formatPercent(analysis.roi5Year)}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <RecommendationBadge recommendation={analysis.recommendation} score={analysis.score} />
          <span className="text-sm text-gray-500">
            Recuperas en {monthsToYearsMonths(analysis.breakEvenMonth)}
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
    <div className={`bg-white rounded-xl border overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Terreno + Crédito</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Precio</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Cash Req.</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Dividendo</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">ROI 5Y</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">ROI 10Y</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {combos.map((combo) => (
              <tr key={`${combo.land.id}-${combo.credit.id}`} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{combo.land.name}</div>
                  <div className="text-sm text-gray-500">{combo.credit.bank}</div>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(combo.land.askingPrice)}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(combo.analysis.cashRequired)}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(combo.analysis.monthlyPayment)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={combo.analysis.roi5Year > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {combo.analysis.roi5Year > 0 ? '+' : ''}{formatPercent(combo.analysis.roi5Year)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={combo.analysis.roi10Year > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {combo.analysis.roi10Year > 0 ? '+' : ''}{formatPercent(combo.analysis.roi10Year)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                    combo.analysis.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                    combo.analysis.score >= 60 ? 'bg-blue-100 text-blue-700' :
                    combo.analysis.score >= 40 ? 'bg-gray-100 text-gray-700' :
                    'bg-rose-100 text-rose-700'
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
  const zoningColors = {
    residential: 'bg-blue-100 text-blue-800',
    commercial: 'bg-purple-100 text-purple-800',
    industrial: 'bg-orange-100 text-orange-800',
    agricultural: 'bg-green-100 text-green-800',
    mixed: 'bg-pink-100 text-pink-800',
    undefined: 'bg-gray-100 text-gray-800'
  }

  const zoningLabels = {
    residential: 'Residencial',
    commercial: 'Comercial',
    industrial: 'Industrial',
    agricultural: 'Agrícola',
    mixed: 'Mixto',
    undefined: 'Sin definir'
  }

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl border p-4 cursor-pointer transition-all
        ${isSelected ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}
        ${className}
      `}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-900">{land.name}</h4>
          <p className="text-sm text-gray-500">{land.location.commune}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${zoningColors[land.zoning]}`}>
          {zoningLabels[land.zoning]}
        </span>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Precio:</span>
          <span className="ml-1 font-medium">{formatCurrency(land.askingPrice)}</span>
        </div>
        <div>
          <span className="text-gray-500">Superficie:</span>
          <span className="ml-1 font-medium">{formatNumber(land.landAreaSquareMeters)} m²</span>
        </div>
      </div>

      {land.belowAppraisalBy > 0 && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
          <TrendingUp className="h-3 w-3" />
          {land.belowAppraisalBy}% bajo tasación
        </div>
      )}

      <div className="mt-2 flex gap-2">
        {land.hasBasicServices && (
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Servicios</span>
        )}
        {land.hasRoadAccess && (
          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Acceso vial</span>
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
        rounded-xl border p-4 cursor-pointer transition-all
        ${isSelected ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}
        ${className}
      `}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-900">{credit.name}</h4>
          <p className="text-sm text-gray-500">{credit.bank}</p>
        </div>
      </div>
      
      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Tasa:</span>
          <span className="font-medium">{credit.annualInterestRate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Plazo:</span>
          <span className="font-medium">{credit.termYears} años</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Crédito real:</span>
          <span className="font-medium text-amber-600">{formatCurrency(credit.effectiveCreditAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Dividendo:</span>
          <span className="font-medium">{formatCurrency(monthlyPayment)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Pie necesario:</span>
          <span className="font-bold text-rose-600">{formatCurrency(credit.requiredDownPayment)}</span>
        </div>
      </div>
    </div>
  )
}

import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '../lib/landCredit'

interface MoneyCardProps {
  title: string
  amount: number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  type?: 'positive' | 'negative' | 'neutral' | 'warning'
  highlight?: boolean
  currency?: string
  icon?: React.ReactNode
  className?: string
}

export function MoneyCard({
  title,
  amount,
  subtitle,
  trend,
  trendValue,
  type = 'neutral',
  highlight = false,
  currency = 'CLP',
  icon,
  className = ''
}: MoneyCardProps) {
  const typeStyles = {
    positive: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    negative: 'bg-rose-50 border-rose-200 text-rose-900',
    neutral: 'bg-white border-gray-200 text-gray-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900'
  }

  const highlightStyles = highlight 
    ? 'ring-2 ring-offset-2 ring-primary-500 shadow-lg' 
    : 'shadow-sm'

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-gray-500'

  return (
    <div className={`rounded-xl border p-5 ${typeStyles[type]} ${highlightStyles} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-70">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(amount, currency)}
          </p>
          {subtitle && (
            <p className="text-sm opacity-60 mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-white/50">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

interface TruthCardProps {
  label: string
  advertised: number
  reality: number
  currency?: string
  className?: string
}

export function TruthCard({ label, advertised, reality, currency = 'CLP', className = '' }: TruthCardProps) {
  const difference = reality - advertised
  const isWorse = difference < 0
  
  return (
    <div className={`rounded-xl border-2 p-5 ${className} ${isWorse ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <div className="mt-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">El banco dice:</span>
          <span className="font-semibold text-gray-900">{formatCurrency(advertised, currency)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">La realidad:</span>
          <span className={`font-bold text-lg ${isWorse ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency(reality, currency)}
          </span>
        </div>
        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Diferencia:</span>
            <span className={`font-bold ${isWorse ? 'text-rose-600' : 'text-emerald-600'}`}>
              {isWorse ? '-' : '+'}{formatCurrency(Math.abs(difference), currency)}
            </span>
          </div>
        </div>
      </div>
      {isWorse && (
        <div className="mt-3 flex items-center gap-2 text-rose-600 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>¡Te quedan {formatCurrency(Math.abs(difference), currency)} menos!</span>
        </div>
      )}
    </div>
  )
}

interface CostBreakdownCardProps {
  title: string
  items: {
    label: string
    amount: number
    isNegative?: boolean
    highlight?: boolean
  }[]
  total: number
  currency?: string
  className?: string
}

export function CostBreakdownCard({
  title,
  items,
  total,
  currency = 'CLP',
  className = ''
}: CostBreakdownCardProps) {
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div 
            key={index}
            className={`flex justify-between items-center py-2 ${
              item.highlight ? 'bg-amber-50 -mx-2 px-2 rounded' : ''
            }`}
          >
            <span className={`text-sm ${item.highlight ? 'font-medium text-amber-900' : 'text-gray-600'}`}>
              {item.label}
            </span>
            <span className={`font-medium ${
              item.isNegative ? 'text-rose-600' : 
              item.highlight ? 'text-amber-700' : 'text-gray-900'
            }`}>
              {item.isNegative ? '-' : ''}{formatCurrency(item.amount, currency)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t-2 border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-900">TOTAL</span>
          <span className="font-bold text-xl text-primary-600">{formatCurrency(total, currency)}</span>
        </div>
      </div>
    </div>
  )
}

interface RecommendationBadgeProps {
  recommendation: 'strong_buy' | 'buy' | 'neutral' | 'avoid' | 'strong_avoid'
  score: number
  className?: string
}

export function RecommendationBadge({ recommendation, score, className = '' }: RecommendationBadgeProps) {
  const config = {
    strong_buy: {
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: <CheckCircle className="h-4 w-4" />,
      label: 'COMPRA FUERTE'
    },
    buy: {
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: <CheckCircle className="h-4 w-4" />,
      label: 'COMPRA'
    },
    neutral: {
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: <Minus className="h-4 w-4" />,
      label: 'NEUTRAL'
    },
    avoid: {
      color: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: <AlertTriangle className="h-4 w-4" />,
      label: 'EVITAR'
    },
    strong_avoid: {
      color: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: <AlertTriangle className="h-4 w-4" />,
      label: 'EVITAR FUERTE'
    }
  }

  const { color, icon, label } = config[recommendation]

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold ${color} ${className}`}>
      {icon}
      <span>{label}</span>
      <span className="ml-1 px-2 py-0.5 rounded-full bg-white/50 text-sm">{score}/100</span>
    </div>
  )
}

interface ScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ScoreGauge({ score, size = 'md', showLabel = true, className = '' }: ScoreGaugeProps) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-sm',
    md: 'w-24 h-24 text-lg',
    lg: 'w-32 h-32 text-2xl'
  }

  const getColor = (s: number) => {
    if (s >= 80) return '#10b981' // emerald
    if (s >= 65) return '#3b82f6' // blue
    if (s >= 45) return '#6b7280' // gray
    if (s >= 25) return '#f59e0b' // amber
    return '#f43f5e' // rose
  }

  const color = getColor(score)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold" style={{ color }}>{score}</span>
        {showLabel && <span className="text-xs text-gray-500">puntos</span>}
      </div>
    </div>
  )
}

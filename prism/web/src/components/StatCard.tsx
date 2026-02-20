import { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    positive: boolean
  }
  variant?: 'default' | 'accent' | 'ghost'
  delay?: number
}

// Animated counter hook
function useAnimatedValue(value: string | number, duration: number = 800) {
  const [displayValue, setDisplayValue] = useState('0')
  
  useEffect(() => {
    // Check if value is numeric
    const numericValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^0-9.-]/g, ''))
      : value
    
    if (isNaN(numericValue)) {
      setDisplayValue(String(value))
      return
    }
    
    const startTime = Date.now()
    const startValue = 0
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out-cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (numericValue - startValue) * easeOut
      
      // Preserve formatting from original value
      if (typeof value === 'string' && value.includes('$')) {
        setDisplayValue('$' + Math.round(current).toLocaleString())
      } else if (typeof value === 'string' && value.includes('.')) {
        setDisplayValue(current.toFixed(2))
      } else {
        setDisplayValue(Math.round(current).toLocaleString())
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, duration])
  
  return displayValue
}

export default function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  trend,
  variant = 'default',
  delay = 0
}: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const animatedValue = useAnimatedValue(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])
  
  const variants = {
    default: 'bg-surface border-border hover:border-border-strong',
    accent: 'bg-cream/5 border-cream/20 hover:border-cream/30',
    ghost: 'bg-transparent border-transparent',
  }
  
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 card-hover ${variants[variant]} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
 
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${variant === 'accent' ? 'bg-cream/10' : 'bg-surface-elevated'}`}>
            <Icon className={`h-5 w-5 ${variant === 'accent' ? 'text-cream' : 'text-text-secondary'}`} />
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-mono ${
              trend.positive ? 'text-success' : 'text-error'
            }`}>
              <span>{trend.positive ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
        
        <div>
          <p className="text-xs font-medium tracking-wider text-text-muted uppercase mb-1">
            {title}
          </p>
          <p className={`font-mono text-2xl font-semibold tracking-tight ${
            variant === 'accent' ? 'text-cream-light' : 'text-text-primary'
          }`}>
            {animatedValue}
          </p>
          
          {description && (
            <p className="text-xs text-text-secondary mt-1.5">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {/* Bottom glow line for accent */}
      {variant === 'accent' && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cream/30 to-transparent" />
      )}
    </div>
  )
}

// Large featured stat card
interface FeaturedStatProps {
  label: string | React.ReactNode
  value: string | number
  sublabel?: string
  icon: LucideIcon
  className?: string
}

export function FeaturedStat({ label, value, sublabel, icon: Icon, className = '' }: FeaturedStatProps) {
  const animatedValue = useAnimatedValue(value, 1200)
  
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-cream/10 bg-surface p-6 sm:p-8 ${className}`}>
      <div className="relative">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-cream/10 border border-cream/20">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-cream" />
          </div>
          <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">
            {label}
          </span>
        </div>
        
        <div className="font-mono text-3xl sm:text-5xl lg:text-6xl font-bold text-gradient tracking-tight break-all">
          {animatedValue}
        </div>
        
        {sublabel && (
          <p className="text-sm text-text-secondary mt-2 sm:mt-3">
            {sublabel}
          </p>
        )}
      </div>
      
    </div>
  )
}

// Compact mini stat for dense layouts
interface MiniStatProps {
  label: string
  value: string | number
  change?: number
}

export function MiniStat({ label, value, change }: MiniStatProps) {
  const animatedValue = useAnimatedValue(value, 600)
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono font-medium text-text-primary">{animatedValue}</span>
        {change !== undefined && (
          <span className={`text-xs font-mono ${change >= 0 ? 'text-success' : 'text-error'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
    </div>
  )
}

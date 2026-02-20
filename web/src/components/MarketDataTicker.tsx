import { useState, useEffect, useCallback } from 'react'
import { Clock, DollarSign, CircleDollarSign, TrendingUp } from 'lucide-react'

interface MarketData {
  usd: number | null
  uf: number | null
  gold: number | null
  lastUpdate: Date | null
}

export default function MarketDataTicker({ collapsed }: { collapsed: boolean }) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [marketData, setMarketData] = useState<MarketData>({
    usd: null,
    uf: null,
    gold: null,
    lastUpdate: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch market data
  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch USD, UF from Mindicador.cl API
      const [usdRes, ufRes] = await Promise.all([
        fetch('https://mindicador.cl/api/dolar'),
        fetch('https://mindicador.cl/api/uf'),
      ])

      if (!usdRes.ok || !ufRes.ok) {
        throw new Error('Failed to fetch market data')
      }

      const usdData = await usdRes.json()
      const ufData = await ufRes.json()

      // Get latest values (API returns array with most recent first)
      const latestUsd = usdData.serie?.[0]?.valor || null
      const latestUf = ufData.serie?.[0]?.valor || null

      // Gold price in CLP per gram (approximate, using a common reference)
      // In production, you might want to use a dedicated gold API
      // For now, using a placeholder that can be replaced with real data
      const goldPrice = null // Will show as "—" until implemented

      setMarketData({
        usd: latestUsd,
        uf: latestUf,
        gold: goldPrice,
        lastUpdate: new Date(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchMarketData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchMarketData])

  // Format Chilean date and time
  const formatChileanDateTime = (date: Date): string => {
    return date.toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  const formatChileanDateShort = (date: Date): string => {
    return date.toLocaleDateString('es-CL', {
      timeZone: 'America/Santiago',
      day: '2-digit',
      month: '2-digit',
    })
  }

  const formatChileanTime = (date: Date): string => {
    return date.toLocaleTimeString('es-CL', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  // Format currency
  const formatCurrency = (value: number | null, decimals: number = 0): string => {
    if (value === null || value === undefined) return '—'
    return value.toLocaleString('es-CL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  // Collapsed view - just icons with tooltips
  if (collapsed) {
    return (
      <div className="px-2 py-3 space-y-3">
        {/* Date/Time Icon */}
        <div className="group relative flex justify-center">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface/50 text-text-muted hover:text-cream hover:bg-surface transition-colors">
            <Clock className="h-4 w-4" />
          </div>
          <div className="absolute left-full ml-2 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
            <div className="text-xs text-text-muted mb-1">Chile ({formatChileanDateShort(currentTime)})</div>
            <div className="font-mono text-cream">{formatChileanTime(currentTime)}</div>
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-surface-elevated border-l border-b border-border rotate-45" />
          </div>
        </div>

        {/* USD Icon */}
        <div className="group relative flex justify-center">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface/50 text-text-muted hover:text-success hover:bg-surface transition-colors">
            <DollarSign className="h-4 w-4" />
          </div>
          <div className="absolute left-full ml-2 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
            <div className="text-xs text-text-muted mb-1">USD/CLP</div>
            <div className="font-mono text-success">
              ${loading ? '...' : formatCurrency(marketData.usd)}
            </div>
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-surface-elevated border-l border-b border-border rotate-45" />
          </div>
        </div>

        {/* UF Icon */}
        <div className="group relative flex justify-center">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface/50 text-text-muted hover:text-warning hover:bg-surface transition-colors">
            <span className="text-[10px] font-bold">UF</span>
          </div>
          <div className="absolute left-full ml-2 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
            <div className="text-xs text-text-muted mb-1">Unidad de Fomento</div>
            <div className="font-mono text-warning">
              ${loading ? '...' : formatCurrency(marketData.uf, 2)}
            </div>
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-surface-elevated border-l border-b border-border rotate-45" />
          </div>
        </div>

        {/* Gold Icon */}
        <div className="group relative flex justify-center">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface/50 text-text-muted hover:text-warning hover:bg-surface transition-colors">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="absolute left-full ml-2 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
            <div className="text-xs text-text-muted mb-1">Oro (CLP/g)</div>
            <div className="font-mono text-warning">
              {marketData.gold ? `$${formatCurrency(marketData.gold)}` : '—'}
            </div>
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-surface-elevated border-l border-b border-border rotate-45" />
          </div>
        </div>
      </div>
    )
  }

  // Expanded view - full display
  return (
    <div className="px-4 py-3 space-y-3">
      {/* Date & Time */}
      <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50">
        <div className="flex items-center gap-2 mb-1.5">
          <Clock className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Chile</span>
        </div>
        <div className="font-mono text-sm text-text-primary truncate" title={formatChileanDateTime(currentTime)}>
          {formatChileanDateTime(currentTime)}
        </div>
      </div>

      {/* Market Data Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* USD */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-success/30 transition-colors">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="h-3 w-3 text-success" />
            <span className="text-[10px] font-medium text-text-muted uppercase">USD</span>
          </div>
          <div className="font-mono text-sm text-success truncate">
            {loading ? (
              <span className="text-text-muted">...</span>
            ) : (
              `$${formatCurrency(marketData.usd)}`
            )}
          </div>
        </div>

        {/* UF */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-warning/30 transition-colors">
          <div className="flex items-center gap-1.5 mb-1">
            <CircleDollarSign className="h-3 w-3 text-warning" />
            <span className="text-[10px] font-medium text-text-muted uppercase">UF</span>
          </div>
          <div className="font-mono text-sm text-warning truncate">
            {loading ? (
              <span className="text-text-muted">...</span>
            ) : (
              `$${formatCurrency(marketData.uf, 2)}`
            )}
          </div>
        </div>

        {/* Gold */}
        <div className="col-span-2 p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-warning/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-warning" />
              <span className="text-[10px] font-medium text-text-muted uppercase">Oro</span>
            </div>
            <span className="text-[9px] text-text-muted">CLP/g</span>
          </div>
          <div className="font-mono text-sm text-warning mt-1">
            {marketData.gold ? `$${formatCurrency(marketData.gold)}` : (
              <span className="text-text-muted text-xs">No disponible</span>
            )}
          </div>
        </div>
      </div>

      {/* Last Update & Refresh */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[9px] text-text-muted">
          {marketData.lastUpdate ? (
            `Actualizado: ${marketData.lastUpdate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`
          ) : (
            'Actualizando...'
          )}
        </span>
        <button
          onClick={fetchMarketData}
          disabled={loading}
          className="text-[9px] text-cream hover:text-cream/80 disabled:text-text-muted transition-colors"
          title="Actualizar datos"
        >
          {loading ? '...' : '↻'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-[9px] text-error px-1">
          Error al cargar datos
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Clock, DollarSign, CircleDollarSign, TrendingUp, Circle, Bitcoin } from 'lucide-react'

interface MarketData {
  usd: number | null
  uf: number | null
  gold: number | null
  silver: number | null
  bitcoin: number | null
  ethereum: number | null
  lastUpdate: Date | null
}

interface MarketDataTickerProps {
  collapsed: boolean
  showTime?: boolean
}

export default function MarketDataTicker({ collapsed, showTime = true }: MarketDataTickerProps) {
  // showTime is reserved for future use
  void showTime
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [marketData, setMarketData] = useState<MarketData>({
    usd: null,
    uf: null,
    gold: null,
    silver: null,
    bitcoin: null,
    ethereum: null,
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

      // Fetch precious metals prices from backend (avoids CORS issues)
      let goldPriceClpPerGram: number | null = null
      let silverPriceClpPerGram: number | null = null

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const marketRes = await fetch(`${apiUrl}/api/v1/dashboard/market-data`, {
          signal: AbortSignal.timeout(10000)
        })

        if (marketRes.ok) {
          const marketData = await marketRes.json()
          goldPriceClpPerGram = marketData.gold_clp_per_gram
          silverPriceClpPerGram = marketData.silver_clp_per_gram
          console.log('[MarketData] Gold CLP/g:', goldPriceClpPerGram)
          console.log('[MarketData] Silver CLP/g:', silverPriceClpPerGram)
        } else {
          console.warn('[MarketData] Market data API failed:', marketRes.status)
        }
      } catch (err) {
        console.error('[MarketData] Metals fetch error:', err)
      }

      // Fetch crypto prices (Bitcoin & Ethereum in USD)
      let bitcoinPriceUsd: number | null = null
      let ethereumPriceUsd: number | null = null

      try {
        const cryptoRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
          { signal: AbortSignal.timeout(5000) }
        )
        if (cryptoRes.ok) {
          const cryptoData = await cryptoRes.json()
          bitcoinPriceUsd = cryptoData.bitcoin?.usd || null
          ethereumPriceUsd = cryptoData.ethereum?.usd || null
        }
      } catch {
        // Crypto prices not critical, continue without them
      }

      // Convert crypto to CLP
      const bitcoinPriceClp = bitcoinPriceUsd && latestUsd
        ? bitcoinPriceUsd * latestUsd
        : null
      const ethereumPriceClp = ethereumPriceUsd && latestUsd
        ? ethereumPriceUsd * latestUsd
        : null

      setMarketData({
        usd: latestUsd,
        uf: latestUf,
        gold: goldPriceClpPerGram,
        silver: silverPriceClpPerGram,
        bitcoin: bitcoinPriceClp,
        ethereum: ethereumPriceClp,
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

  // Compact format for large numbers (e.g., 58.032.080 -> 58,03M)
  const formatCompact = (value: number | null): string => {
    if (value === null || value === undefined) return '—'
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(2).replace('.', ',') + 'M'
    }
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(2).replace('.', ',') + 'M'
    }
    if (value >= 1_000) {
      return (value / 1_000).toFixed(2).replace('.', ',') + 'k'
    }
    return value.toLocaleString('es-CL')
  }

  // Collapsed view - just icons with tooltips
  if (collapsed) {
    return (
      <div className="px-2 py-3 space-y-3">
        {/* Date/Time Icon - only show if showTime is true */}
        {showTime && (
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
        )}

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

        {/* Silver Icon */}
        <div className="group relative flex justify-center">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface/50 text-text-muted hover:text-blue-400 hover:bg-surface transition-colors">
            <Circle className="h-4 w-4" />
          </div>
          <div className="absolute left-full ml-2 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
            <div className="text-xs text-text-muted mb-1">Plata (CLP/g)</div>
            <div className="font-mono text-blue-400">
              {marketData.silver ? `$${formatCurrency(marketData.silver)}` : '—'}
            </div>
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-surface-elevated border-l border-b border-border rotate-45" />
          </div>
        </div>

        {/* Bitcoin Icon */}
        <div className="group relative flex justify-center">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface/50 text-text-muted hover:text-orange-500 hover:bg-surface transition-colors">
            <Bitcoin className="h-4 w-4" />
          </div>
          <div className="absolute left-full ml-2 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
            <div className="text-xs text-text-muted mb-1">Bitcoin (CLP)</div>
            <div className="font-mono text-orange-500">
              {marketData.bitcoin ? `$${formatCurrency(marketData.bitcoin)}` : '—'}
            </div>
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-surface-elevated border-l border-b border-border rotate-45" />
          </div>
        </div>

        {/* Ethereum Icon */}
        <div className="group relative flex justify-center">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface/50 text-text-muted hover:text-indigo-400 hover:bg-surface transition-colors">
            <span className="text-xs font-bold">Ξ</span>
          </div>
          <div className="absolute left-full ml-2 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
            <div className="text-xs text-text-muted mb-1">Ethereum (CLP)</div>
            <div className="font-mono text-indigo-400">
              {marketData.ethereum ? `$${formatCurrency(marketData.ethereum)}` : '—'}
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
      {/* Date & Time - only show if showTime is true */}
      {showTime && (
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50">
          <div className="flex items-center gap-2 mb-1.5">
            <Clock className="h-3.5 w-3.5 text-text-muted" />
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Chile</span>
          </div>
          <div className="font-mono text-sm text-text-primary truncate" title={formatChileanDateTime(currentTime)}>
            {formatChileanDateTime(currentTime)}
          </div>
        </div>
      )}

      {/* Market Data Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* USD */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-success/30 transition-colors">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="h-3 w-3 text-success" />
            <span className="text-[10px] font-medium text-text-muted uppercase">USD</span>
          </div>
          <div 
            className="font-mono text-success truncate text-sm"
            title={marketData.usd ? `$${formatCurrency(marketData.usd)}` : '—'}
          >
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
          <div 
            className="font-mono text-warning truncate text-sm"
            title={marketData.uf ? `$${formatCurrency(marketData.uf, 2)}` : '—'}
          >
            {loading ? (
              <span className="text-text-muted">...</span>
            ) : (
              `$${formatCurrency(marketData.uf, 2)}`
            )}
          </div>
        </div>

        {/* Gold */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-warning/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-warning" />
              <span className="text-[10px] font-medium text-text-muted uppercase">Oro</span>
            </div>
            <span className="text-[9px] text-text-muted">/g</span>
          </div>
          <div 
            className="font-mono text-warning mt-1 truncate text-sm"
            title={marketData.gold ? `$${formatCurrency(marketData.gold)}` : '—'}
          >
            {loading ? (
              <span className="text-text-muted">...</span>
            ) : marketData.gold ? (
              `$${formatCurrency(marketData.gold)}`
            ) : (
              <span className="text-text-muted text-xs">—</span>
            )}
          </div>
        </div>

        {/* Silver */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-blue-400/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Circle className="h-3 w-3 text-blue-400" />
              <span className="text-[10px] font-medium text-text-muted uppercase">Plata</span>
            </div>
            <span className="text-[9px] text-text-muted">/g</span>
          </div>
          <div 
            className="font-mono text-blue-400 mt-1 truncate text-sm"
            title={marketData.silver ? `$${formatCurrency(marketData.silver)}` : '—'}
          >
            {loading ? (
              <span className="text-text-muted">...</span>
            ) : marketData.silver ? (
              `$${formatCurrency(marketData.silver)}`
            ) : (
              <span className="text-text-muted text-xs">—</span>
            )}
          </div>
        </div>

        {/* Bitcoin */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-orange-500/30 transition-colors group relative">
          <div className="flex items-center gap-1.5 mb-1">
            <Bitcoin className="h-3 w-3 text-orange-500" />
            <span className="text-[10px] font-medium text-text-muted uppercase">BTC</span>
          </div>
          <div 
            className="font-mono text-orange-500 truncate text-sm"
            title={marketData.bitcoin ? `$${formatCurrency(marketData.bitcoin)}` : '—'}
          >
            {loading ? (
              <span className="text-text-muted">...</span>
            ) : marketData.bitcoin ? (
              marketData.bitcoin >= 1_000_000 ? (
                <span>${formatCompact(marketData.bitcoin)}</span>
              ) : (
                `$${formatCurrency(marketData.bitcoin)}`
              )
            ) : (
              <span className="text-text-muted text-xs">—</span>
            )}
          </div>
          {/* Tooltip for full value */}
          {marketData.bitcoin && marketData.bitcoin >= 1_000_000 && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-surface-elevated border border-border rounded text-xs text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg">
              ${formatCurrency(marketData.bitcoin)}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-1.5 h-1.5 bg-surface-elevated border-r border-b border-border rotate-45 -mt-0.5" />
            </div>
          )}
        </div>

        {/* Ethereum */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-indigo-400/30 transition-colors group relative">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold text-indigo-400">Ξ</span>
            <span className="text-[10px] font-medium text-text-muted uppercase">ETH</span>
          </div>
          <div 
            className="font-mono text-indigo-400 truncate text-sm"
            title={marketData.ethereum ? `$${formatCurrency(marketData.ethereum)}` : '—'}
          >
            {loading ? (
              <span className="text-text-muted">...</span>
            ) : marketData.ethereum ? (
              marketData.ethereum >= 1_000_000 ? (
                <span>${formatCompact(marketData.ethereum)}</span>
              ) : (
                `$${formatCurrency(marketData.ethereum)}`
              )
            ) : (
              <span className="text-text-muted text-xs">—</span>
            )}
          </div>
          {/* Tooltip for full value */}
          {marketData.ethereum && marketData.ethereum >= 1_000_000 && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-surface-elevated border border-border rounded text-xs text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg">
              ${formatCurrency(marketData.ethereum)}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-1.5 h-1.5 bg-surface-elevated border-r border-b border-border rotate-45 -mt-0.5" />
            </div>
          )}
        </div>
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

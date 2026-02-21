import { useState, useEffect, useCallback } from 'react'
import { Clock, DollarSign, CircleDollarSign, Bitcoin, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../lib/api'
import HelpTooltip from './HelpTooltip'
import { INVESTMENT_TOOLTIPS } from '../lib/tooltips'
interface MarketData {
  usd: number | null
  uf: number | null
  eur: number | null
  utm: number | null
  nasdaq: number | null
  nasdaqChange: number | null
  oil: number | null
  gold: number | null
  silver: number | null
  copper: number | null
  copperKg: number | null
  lithium: number | null
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

  // Fetch portfolio stats
  const { data: portfolioStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  })

  const totalReturn = portfolioStats?.total_return || 0
  const [marketData, setMarketData] = useState<MarketData>({
    usd: null,
    uf: null,
    eur: null,
    utm: null,
    nasdaq: null,
    nasdaqChange: null,
    oil: null,
    gold: null,
    silver: null,
    copper: null,
    copperKg: null,
    lithium: null,
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

      // Fetch USD, UF, EUR, UTM from Mindicador.cl API
      const [usdRes, ufRes, eurRes, utmRes] = await Promise.all([
        fetch('https://mindicador.cl/api/dolar'),
        fetch('https://mindicador.cl/api/uf'),
        fetch('https://mindicador.cl/api/euro'),
        fetch('https://mindicador.cl/api/utm'),
      ])

      if (!usdRes.ok || !ufRes.ok) {
        throw new Error('Failed to fetch market data')
      }

      const usdData = await usdRes.json()
      const ufData = await ufRes.json()
      const eurData = eurRes.ok ? await eurRes.json() : null
      const utmData = utmRes.ok ? await utmRes.json() : null

      // Get latest values (API returns array with most recent first)
      const latestUsd = usdData.serie?.[0]?.valor || null
      const latestUf = ufData.serie?.[0]?.valor || null
      const latestEur = eurData?.serie?.[0]?.valor || null
      const latestUtm = utmData?.serie?.[0]?.valor || null

      // Fetch metals, NASDAQ, oil, copper, lithium from backend (avoids CORS with Yahoo)
      let goldPriceClpPerGram: number | null = null
      let silverPriceClpPerGram: number | null = null
      let nasdaqPrice: number | null = null
      let nasdaqChange: number | null = null
      let oilPrice: number | null = null
      let copperPriceLb: number | null = null
      let copperPriceKg: number | null = null
      let lithiumPrice: number | null = null

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const marketRes = await fetch(`${apiUrl}/api/v1/dashboard/market-data`, {
          signal: AbortSignal.timeout(8000)
        })
        const contentType = marketRes.headers.get('content-type')
        if (marketRes.ok && contentType?.includes('application/json')) {
          const md = await marketRes.json()
          goldPriceClpPerGram = md.gold_clp_per_gram ?? null
          silverPriceClpPerGram = md.silver_clp_per_gram ?? null
          nasdaqPrice = md.nasdaq_price ?? null
          nasdaqChange = md.nasdaq_change_pct ?? null
          oilPrice = md.oil_usd_bbl ?? null
          copperPriceLb = md.copper_usd_lb ?? null
          copperPriceKg = md.copper_usd_kg ?? null
          lithiumPrice = md.lithium_proxy_usd ?? null
          console.log('[MarketData] Backend response:', md)
        }
      } catch (err) {
        console.warn('[MarketData] Backend unavailable, trying Yahoo fallback:', err)
      }

      // If backend didn't return Yahoo data, log it — direct Yahoo calls from
      // the browser are blocked by CORS, so the backend is required.
      if (goldPriceClpPerGram === null && nasdaqPrice === null) {
        console.warn('[MarketData] Backend returned no Yahoo data. Ensure the API server is running.')
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
        eur: latestEur,
        utm: latestUtm,
        nasdaq: nasdaqPrice,
        nasdaqChange,
        oil: oilPrice,
        gold: goldPriceClpPerGram,
        silver: silverPriceClpPerGram,
        copper: copperPriceLb,
        copperKg: copperPriceKg,
        lithium: lithiumPrice,
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

  // Collapsed view - 2-column icon grid with tooltips
  // Icon helper to avoid repetition
  const ColIcon = ({
    color, tooltipKey, valueBlock, children
  }: { color: string; tooltipKey?: keyof typeof INVESTMENT_TOOLTIPS; valueBlock: React.ReactNode; children: React.ReactNode }) => {
    const tooltipData = tooltipKey ? INVESTMENT_TOOLTIPS[tooltipKey] as any : null;
    return (
      <HelpTooltip
        title={tooltipData?.title || 'Valor'}
        content={
          <div className="flex flex-col gap-1 min-w-[14rem]">
            <div className={`font-mono text-lg mb-1 ${color.replace('hover:', '')}`}>
              {valueBlock}
            </div>
            {tooltipData?.content}
          </div>
        }
        example={tooltipData?.example}
        position="bottom"
      >
        <div className={`w-7 h-7 flex items-center justify-center rounded-lg bg-surface/50 text-text-muted transition-colors hover:bg-surface ${color} cursor-help`}>
          {children}
        </div>
      </HelpTooltip>
    )
  }

  // Helper for expanded view titles with tooltips
  const ExpandedTitle = ({ icon: Icon, iconNode, text, tooltipKey, className = '' }: { icon?: any, iconNode?: React.ReactNode, text: string, tooltipKey?: keyof typeof INVESTMENT_TOOLTIPS, className?: string }) => {
    const tooltipData = tooltipKey ? INVESTMENT_TOOLTIPS[tooltipKey] as any : null;

    // We wrap the span in a group so hover effects still trigger, and HelpTooltip handles hover
    const labelContent = (
      <div className={`flex items-center ${className} cursor-help`}>
        {Icon ? <Icon className="h-3 w-3 mr-1.5" /> : iconNode ? <div className="mr-1.5 flex items-center">{iconNode}</div> : null}
        <span className="text-[10px] font-medium text-text-muted uppercase transition-colors hover:text-text-primary underline decoration-border decoration-dashed underline-offset-2">
          {text}
        </span>
      </div>
    );

    if (tooltipData) {
      return (
        <HelpTooltip
          title={tooltipData.title}
          content={tooltipData.content}
          example={tooltipData.example}
          position="bottom"
        >
          {labelContent}
        </HelpTooltip>
      );
    }
    return labelContent;
  }

  if (collapsed) {
    return (
      <div className="px-1.5 pt-2 pb-1">
        <div className="grid grid-cols-2 gap-1.5">

          {/* Row 1: UF | UTM */}
          <ColIcon color="hover:text-warning" tooltipKey="uf" valueBlock={`$${loading ? '...' : formatCurrency(marketData.uf, 2)}`}>
            <span className="text-[10px] font-bold">UF</span>
          </ColIcon>
          <ColIcon color="hover:text-purple-400" tooltipKey="utm" valueBlock={`$${loading ? '...' : formatCurrency(marketData.utm)}`}>
            <span className="text-[8px] font-bold">UTM</span>
          </ColIcon>

          {/* Row 2: EUR | USD */}
          <ColIcon color="hover:text-sky-400" tooltipKey="eur" valueBlock={`$${loading ? '...' : formatCurrency(marketData.eur)}`}>
            <span className="text-[11px] font-bold">€</span>
          </ColIcon>
          <ColIcon color="hover:text-success" tooltipKey="usd" valueBlock={`$${loading ? '...' : formatCurrency(marketData.usd)}`}>
            <DollarSign className="h-3.5 w-3.5" />
          </ColIcon>

          {/* Row 3: NASDAQ | OIL */}
          <ColIcon color="hover:text-emerald-400" tooltipKey="nasdaq" valueBlock={<>{marketData.nasdaq ? marketData.nasdaq.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}{marketData.nasdaqChange !== null && <div className={`text-xs mt-0.5 ${marketData.nasdaqChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{marketData.nasdaqChange >= 0 ? '+' : ''}{marketData.nasdaqChange.toFixed(2)}%</div>}</>}>
            <span className="text-[8px] font-bold tracking-tight">NDQ</span>
          </ColIcon>
          <ColIcon color="hover:text-amber-500" tooltipKey="wti" valueBlock={`$${marketData.oil ? marketData.oil.toFixed(2) : '—'}`}>
            <span className="text-[8px] font-bold">OIL</span>
          </ColIcon>

          {/* Row 4: Gold | Silver */}
          <ColIcon color="hover:text-warning" tooltipKey="gold" valueBlock={`$${marketData.gold ? formatCurrency(marketData.gold) : '—'}`}>
            <span className="text-[10px] font-bold">Au</span>
          </ColIcon>
          <ColIcon color="hover:text-blue-400" tooltipKey="silver" valueBlock={`$${marketData.silver ? formatCurrency(marketData.silver) : '—'}`}>
            <span className="text-[10px] font-bold">Ag</span>
          </ColIcon>

          {/* Row 5: Copper | Lithium */}
          <ColIcon color="hover:text-orange-400" tooltipKey="copper" valueBlock={<>${marketData.copper ? marketData.copper.toFixed(2) : '—'}{marketData.copperKg && <div className="text-[10px] text-text-muted mt-0.5">${marketData.copperKg.toFixed(0)}/kg</div>}</>}>
            <span className="text-[10px] font-bold">Cu</span>
          </ColIcon>
          <ColIcon color="hover:text-teal-400" tooltipKey="lithium" valueBlock={`$${marketData.lithium ? marketData.lithium.toFixed(2) : '—'}`}>
            <span className="text-[10px] font-bold">Li</span>
          </ColIcon>

          {/* Row 6: BTC | ETH */}
          <ColIcon color="hover:text-orange-500" tooltipKey="bitcoin" valueBlock={`$${marketData.bitcoin ? formatCurrency(marketData.bitcoin) : '—'}`}>
            <Bitcoin className="h-3.5 w-3.5" />
          </ColIcon>
          <ColIcon color="hover:text-indigo-400" tooltipKey="ethereum" valueBlock={`$${marketData.ethereum ? formatCurrency(marketData.ethereum) : '—'}`}>
            <span className="text-[10px] font-bold">Ξ</span>
          </ColIcon>

          {/* Row 7: Ganancia | Pérdida */}
          <ColIcon color="hover:text-success" tooltipKey="totalGain" valueBlock={`$${totalReturn >= 0 ? formatCurrency(totalReturn) : '—'}`}>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </ColIcon>
          <ColIcon color="hover:text-error" tooltipKey="totalLoss" valueBlock={`$${totalReturn < 0 ? formatCurrency(Math.abs(totalReturn)) : '—'}`}>
            <ArrowDownRight className="h-3.5 w-3.5" />
          </ColIcon>

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

      {/* Portfolio Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Profit */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-success/30 transition-colors">
          <ExpandedTitle icon={ArrowUpRight} text="Ganancia" tooltipKey="totalGain" className="mb-1 text-success" />
          <div
            className="font-mono text-success truncate text-sm"
            title={totalReturn >= 0 ? `$${formatCurrency(totalReturn)}` : '—'}
          >
            {totalReturn >= 0 ? `$${formatCurrency(totalReturn)}` : '—'}
          </div>
        </div>

        {/* Loss */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-error/30 transition-colors">
          <ExpandedTitle icon={ArrowDownRight} text="Pérdida" tooltipKey="totalLoss" className="mb-1 text-error" />
          <div
            className="font-mono text-error truncate text-sm"
            title={totalReturn < 0 ? `$${formatCurrency(Math.abs(totalReturn))}` : '—'}
          >
            {totalReturn < 0 ? `$${formatCurrency(Math.abs(totalReturn))}` : '—'}
          </div>
        </div>
      </div>

      {/* UF & UTM Grid (Chilean indexed units) */}
      <div className="grid grid-cols-2 gap-2">
        {/* UF */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-warning/30 transition-colors">
          <ExpandedTitle icon={CircleDollarSign} text="UF" tooltipKey="uf" className="mb-1 text-warning" />
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

        {/* UTM */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-purple-400/30 transition-colors">
          <ExpandedTitle iconNode={<span className="text-[9px] font-bold text-purple-400 leading-none">UTM</span>} text="CLP" tooltipKey="utm" className="mb-1" />
          <div
            className="font-mono text-purple-400 truncate text-sm"
            title={marketData.utm ? `$${formatCurrency(marketData.utm)}` : '—'}
          >
            {loading ? (
              <span className="text-text-muted">...</span>
            ) : (
              `$${formatCurrency(marketData.utm)}`
            )}
          </div>
        </div>
      </div>

      {/* EUR & USD Grid (foreign currencies) */}
      <div className="grid grid-cols-2 gap-2">
        {/* EUR */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-sky-400/30 transition-colors">
          <ExpandedTitle iconNode={<span className="text-[11px] font-bold text-sky-400">€</span>} text="EUR" tooltipKey="eur" className="mb-1" />
          <div
            className="font-mono text-sky-400 truncate text-sm"
            title={marketData.eur ? `$${formatCurrency(marketData.eur)}` : '—'}
          >
            {loading ? (
              <span className="text-text-muted">...</span>
            ) : (
              `$${formatCurrency(marketData.eur)}`
            )}
          </div>
        </div>

        {/* USD */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-success/30 transition-colors">
          <ExpandedTitle icon={DollarSign} text="USD" tooltipKey="usd" className="mb-1 text-success" />
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
      </div>

      {/* NASDAQ & Oil Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* NASDAQ */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-emerald-400/30 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <ExpandedTitle iconNode={<span className="text-[8px] font-bold text-emerald-400 tracking-tight">NDQ</span>} text="Nasdaq" tooltipKey="nasdaq" />
            {marketData.nasdaqChange !== null && (
              <span className={`text-[9px] font-semibold ${marketData.nasdaqChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                {marketData.nasdaqChange >= 0 ? '+' : ''}{marketData.nasdaqChange.toFixed(2)}%
              </span>
            )}
          </div>
          <div
            className="font-mono text-emerald-400 truncate text-sm"
            title={marketData.nasdaq ? marketData.nasdaq.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
          >
            {loading ? (
              <span className="text-text-muted">...</span>
            ) : marketData.nasdaq ? (
              marketData.nasdaq.toLocaleString('en-US', { maximumFractionDigits: 0 })
            ) : (
              <span className="text-text-muted text-xs">—</span>
            )}
          </div>
        </div>

        {/* WTI Oil */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <ExpandedTitle iconNode={<span className="text-[9px] font-bold text-amber-500">OIL</span>} text="WTI" tooltipKey="wti" />
            <span className="text-[9px] text-text-muted">/bbl</span>
          </div>
          <div
            className="font-mono text-amber-500 mt-1 truncate text-sm"
            title={marketData.oil ? `$${marketData.oil.toFixed(2)}` : '—'}
          >
            {loading ? (
              <span className="text-text-muted">...</span>
            ) : marketData.oil ? (
              `$${marketData.oil.toFixed(2)}`
            ) : (
              <span className="text-text-muted text-xs">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Gold & Silver Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Gold */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-warning/30 transition-colors">
          <div className="flex items-center justify-between">
            <ExpandedTitle iconNode={<span className="text-[10px] font-bold text-warning">Au</span>} text="Oro" tooltipKey="gold" className="text-warning" />
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
            <ExpandedTitle iconNode={<span className="text-[10px] font-bold text-blue-400">Ag</span>} text="Plata" tooltipKey="silver" className="text-blue-400" />
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
      </div>

      {/* Copper & Lithium Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Copper */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-orange-400/30 transition-colors">
          <div className="flex items-center justify-between">
            <ExpandedTitle iconNode={<span className="text-[10px] font-bold text-orange-400">Cu</span>} text="Cobre" tooltipKey="copper" />
            <span className="text-[9px] text-text-muted">/lb</span>
          </div>
          <div
            className="font-mono text-orange-400 mt-1 truncate text-sm"
            title={marketData.copper ? `$${marketData.copper.toFixed(2)} /lb — $${marketData.copperKg?.toFixed(2) ?? '—'} /kg` : '—'}
          >
            {loading ? (
              <span className="text-text-muted">...</span>
            ) : marketData.copper ? (
              `$${marketData.copper.toFixed(2)}`
            ) : (
              <span className="text-text-muted text-xs">—</span>
            )}
          </div>
          {marketData.copperKg && !loading && (
            <div className="text-[10px] text-text-muted font-mono mt-0.5">${marketData.copperKg.toFixed(0)}/kg</div>
          )}
        </div>

        {/* Lithium (ALB proxy) */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-teal-400/30 transition-colors">
          <div className="flex items-center justify-between">
            <ExpandedTitle iconNode={<span className="text-[10px] font-bold text-teal-400">Li</span>} text="Litio" tooltipKey="lithium" />
            <span className="text-[9px] text-text-muted">ALB</span>
          </div>
          <div
            className="font-mono text-teal-400 mt-1 truncate text-sm"
            title={marketData.lithium ? `$${marketData.lithium.toFixed(2)} (ALB)` : '—'}
          >
            {loading ? (
              <span className="text-text-muted">...</span>
            ) : marketData.lithium ? (
              `$${marketData.lithium.toFixed(2)}`
            ) : (
              <span className="text-text-muted text-xs">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Crypto Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Bitcoin */}
        <div className="p-2.5 rounded-xl bg-surface/40 border border-border/50 hover:border-orange-500/30 transition-colors group relative">
          <ExpandedTitle icon={Bitcoin} text="BTC" tooltipKey="bitcoin" className="mb-1 text-orange-500" />
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
          <ExpandedTitle iconNode={<span className="text-[10px] font-bold text-indigo-400">Ξ</span>} text="ETH" tooltipKey="ethereum" className="mb-1" />
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

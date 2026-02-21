const fs = require('fs');
let content = fs.readFileSync('src/components/MarketDataTicker.tsx', 'utf-8');

// 1. Add imports
content = content.replace(
  "import { dashboardApi } from '../lib/api'",
  "import { dashboardApi } from '../lib/api'\nimport HelpTooltip from './HelpTooltip'\nimport { INVESTMENT_TOOLTIPS } from '../lib/tooltips'"
);

// 2. Replace ColIcon definition
const colIconOld = `  const ColIcon = ({
    color, tooltip, children
  }: { color: string; tooltip: React.ReactNode; children: React.ReactNode }) => (
    <div className="group relative flex justify-center">
      <div className=\`w-7 h-7 flex items-center justify-center rounded-lg bg-surface/50 text-text-muted transition-colors hover:bg-surface \${color}\`>
        {children}
      </div>
      <div className="absolute left-full ml-3 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
        {tooltip}
        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-surface-elevated border-l border-b border-border rotate-45" />
      </div>
    </div>
  )`;

const colIconNew = `  const ColIcon = ({
    color, tooltipKey, valueBlock, children
  }: { color: string; tooltipKey?: keyof typeof INVESTMENT_TOOLTIPS; valueBlock: React.ReactNode; children: React.ReactNode }) => {
    const tooltipData = tooltipKey ? INVESTMENT_TOOLTIPS[tooltipKey] : null;
    return (
      <HelpTooltip 
        title={tooltipData?.title || 'Valor'}
        content={
          <div className="flex flex-col gap-1 min-w-[12rem]">
            <div className={\`font-mono text-lg mb-1 \${color.replace('hover:', '')}\`}>
              {valueBlock}
            </div>
            {tooltipData?.content}
          </div>
        }
        example={tooltipData?.example}
        position="right"
      >
        <div className={\`w-7 h-7 flex items-center justify-center rounded-lg bg-surface/50 text-text-muted transition-colors hover:bg-surface \${color} cursor-help\`}>
          {children}
        </div>
      </HelpTooltip>
    )
  }

  // Helper for expanded view titles with tooltips
  const ExpandedTitle = ({ icon: Icon, iconNode, text, tooltipKey, className = '' }: { icon?: any, iconNode?: React.ReactNode, text: string, tooltipKey?: keyof typeof INVESTMENT_TOOLTIPS, className?: string }) => {
    const tooltipData = tooltipKey ? INVESTMENT_TOOLTIPS[tooltipKey] : null;
    
    // We wrap the span in a group so hover effects still trigger, and HelpTooltip handles hover
    const labelContent = (
      <div className={\`flex items-center \${className} cursor-help\`}>
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
          position="right"
        >
          {labelContent}
        </HelpTooltip>
      );
    }
    return labelContent;
  }`;

content = content.replace(colIconOld, colIconNew);

// 3. Replace ColIcon Usages (collapsed view)
content = content.replace(
  `          {/* Row 1: UF | UTM */}
          <ColIcon color="hover:text-warning" tooltip={<><div className="text-xs text-text-muted mb-1">Unidad de Fomento</div><div className="font-mono text-warning">\${loading ? '...' : formatCurrency(marketData.uf, 2)}</div></>}>
            <span className="text-[10px] font-bold">UF</span>
          </ColIcon>
          <ColIcon color="hover:text-purple-400" tooltip={<><div className="text-xs text-text-muted mb-1">Unidad Trib. Mensual</div><div className="font-mono text-purple-400">\${loading ? '...' : formatCurrency(marketData.utm)}</div></>}>
            <span className="text-[8px] font-bold">UTM</span>
          </ColIcon>

          {/* Row 2: EUR | USD */}
          <ColIcon color="hover:text-sky-400" tooltip={<><div className="text-xs text-text-muted mb-1">EUR/CLP</div><div className="font-mono text-sky-400">\${loading ? '...' : formatCurrency(marketData.eur)}</div></>}>
            <span className="text-[11px] font-bold">€</span>
          </ColIcon>
          <ColIcon color="hover:text-success" tooltip={<><div className="text-xs text-text-muted mb-1">USD/CLP</div><div className="font-mono text-success">\${loading ? '...' : formatCurrency(marketData.usd)}</div></>}>
            <DollarSign className="h-3.5 w-3.5" />
          </ColIcon>

          {/* Row 3: NASDAQ | OIL */}
          <ColIcon color="hover:text-emerald-400" tooltip={<><div className="text-xs text-text-muted mb-1">NASDAQ Composite</div><div className="font-mono text-emerald-400">{marketData.nasdaq ? marketData.nasdaq.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}</div>{marketData.nasdaqChange !== null && <div className={\`text-xs mt-0.5 \${marketData.nasdaqChange >= 0 ? 'text-emerald-400' : 'text-red-400'}\`}>{marketData.nasdaqChange >= 0 ? '+' : ''}{marketData.nasdaqChange.toFixed(2)}%</div>}</>}>
            <span className="text-[8px] font-bold tracking-tight">NDQ</span>
          </ColIcon>
          <ColIcon color="hover:text-amber-500" tooltip={<><div className="text-xs text-text-muted mb-1">WTI Crude (USD/bbl)</div><div className="font-mono text-amber-500">{marketData.oil ? \`$\${marketData.oil.toFixed(2)}\` : '—'}</div></>}>
            <span className="text-[8px] font-bold">OIL</span>
          </ColIcon>

          {/* Row 4: Gold | Silver */}
          <ColIcon color="hover:text-warning" tooltip={<><div className="text-xs text-text-muted mb-1">Oro (CLP/g)</div><div className="font-mono text-warning">{marketData.gold ? \`$\${formatCurrency(marketData.gold)}\` : '—'}</div></>}>
            <TrendingUp className="h-3.5 w-3.5" />
          </ColIcon>
          <ColIcon color="hover:text-blue-400" tooltip={<><div className="text-xs text-text-muted mb-1">Plata (CLP/g)</div><div className="font-mono text-blue-400">{marketData.silver ? \`$\${formatCurrency(marketData.silver)}\` : '—'}</div></>}>
            <Circle className="h-3.5 w-3.5" />
          </ColIcon>

          {/* Row 5: Copper | Lithium */}
          <ColIcon color="hover:text-orange-400" tooltip={<><div className="text-xs text-text-muted mb-1">Cobre (USD/lb)</div><div className="font-mono text-orange-400">{marketData.copper ? \`$\${marketData.copper.toFixed(2)}\` : '—'}</div>{marketData.copperKg && <div className="text-[10px] text-text-muted mt-0.5">\${marketData.copperKg.toFixed(0)}/kg</div>}</>}>
            <span className="text-[8px] font-bold">CU</span>
          </ColIcon>
          <ColIcon color="hover:text-teal-400" tooltip={<><div className="text-xs text-text-muted mb-1">Litio – ALB (USD)</div><div className="font-mono text-teal-400">{marketData.lithium ? \`$\${marketData.lithium.toFixed(2)}\` : '—'}</div></>}>
            <span className="text-[8px] font-bold">Li</span>
          </ColIcon>

          {/* Row 6: BTC | ETH */}
          <ColIcon color="hover:text-orange-500" tooltip={<><div className="text-xs text-text-muted mb-1">Bitcoin (CLP)</div><div className="font-mono text-orange-500">{marketData.bitcoin ? \`$\${formatCurrency(marketData.bitcoin)}\` : '—'}</div></>}>
            <Bitcoin className="h-3.5 w-3.5" />
          </ColIcon>
          <ColIcon color="hover:text-indigo-400" tooltip={<><div className="text-xs text-text-muted mb-1">Ethereum (CLP)</div><div className="font-mono text-indigo-400">{marketData.ethereum ? \`$\${formatCurrency(marketData.ethereum)}\` : '—'}</div></>}>
            <span className="text-[10px] font-bold">Ξ</span>
          </ColIcon>

          {/* Row 7: Ganancia | Pérdida */}
          <ColIcon color="hover:text-success" tooltip={<><div className="text-xs text-text-muted mb-1">Ganancia</div><div className="font-mono text-success">{totalReturn >= 0 ? \`$\${formatCurrency(totalReturn)}\` : '—'}</div></>}>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </ColIcon>
          <ColIcon color="hover:text-error" tooltip={<><div className="text-xs text-text-muted mb-1">Pérdida</div><div className="font-mono text-error">{totalReturn < 0 ? \`$\${formatCurrency(Math.abs(totalReturn))}\` : '—'}</div></>}>
            <ArrowDownRight className="h-3.5 w-3.5" />
          </ColIcon>`,
  `          {/* Row 1: UF | UTM */}
          <ColIcon color="hover:text-warning" tooltipKey="uf" valueBlock={\`$\${loading ? '...' : formatCurrency(marketData.uf, 2)}\`}>
            <span className="text-[10px] font-bold">UF</span>
          </ColIcon>
          <ColIcon color="hover:text-purple-400" tooltipKey="utm" valueBlock={\`$\${loading ? '...' : formatCurrency(marketData.utm)}\`}>
            <span className="text-[8px] font-bold">UTM</span>
          </ColIcon>

          {/* Row 2: EUR | USD */}
          <ColIcon color="hover:text-sky-400" tooltipKey="eur" valueBlock={\`$\${loading ? '...' : formatCurrency(marketData.eur)}\`}>
            <span className="text-[11px] font-bold">€</span>
          </ColIcon>
          <ColIcon color="hover:text-success" tooltipKey="usd" valueBlock={\`$\${loading ? '...' : formatCurrency(marketData.usd)}\`}>
            <DollarSign className="h-3.5 w-3.5" />
          </ColIcon>

          {/* Row 3: NASDAQ | OIL */}
          <ColIcon color="hover:text-emerald-400" tooltipKey="nasdaq" valueBlock={<>{marketData.nasdaq ? marketData.nasdaq.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}{marketData.nasdaqChange !== null && <div className={\`text-xs mt-0.5 \${marketData.nasdaqChange >= 0 ? 'text-emerald-400' : 'text-red-400'}\`}>{marketData.nasdaqChange >= 0 ? '+' : ''}{marketData.nasdaqChange.toFixed(2)}%</div>}</>}>
            <span className="text-[8px] font-bold tracking-tight">NDQ</span>
          </ColIcon>
          <ColIcon color="hover:text-amber-500" tooltipKey="wti" valueBlock={\`$\${marketData.oil ? marketData.oil.toFixed(2) : '—'}\`}>
            <span className="text-[8px] font-bold">OIL</span>
          </ColIcon>

          {/* Row 4: Gold | Silver */}
          <ColIcon color="hover:text-warning" tooltipKey="gold" valueBlock={\`$\${marketData.gold ? formatCurrency(marketData.gold) : '—'}\`}>
            <TrendingUp className="h-3.5 w-3.5" />
          </ColIcon>
          <ColIcon color="hover:text-blue-400" tooltipKey="silver" valueBlock={\`$\${marketData.silver ? formatCurrency(marketData.silver) : '—'}\`}>
            <Circle className="h-3.5 w-3.5" />
          </ColIcon>

          {/* Row 5: Copper | Lithium */}
          <ColIcon color="hover:text-orange-400" tooltipKey="copper" valueBlock={<>$\${marketData.copper ? marketData.copper.toFixed(2) : '—'}{marketData.copperKg && <div className="text-[10px] text-text-muted mt-0.5">\${marketData.copperKg.toFixed(0)}/kg</div>}</>}>
            <span className="text-[8px] font-bold">CU</span>
          </ColIcon>
          <ColIcon color="hover:text-teal-400" tooltipKey="lithium" valueBlock={\`$\${marketData.lithium ? marketData.lithium.toFixed(2) : '—'}\`}>
            <span className="text-[8px] font-bold">Li</span>
          </ColIcon>

          {/* Row 6: BTC | ETH */}
          <ColIcon color="hover:text-orange-500" tooltipKey="bitcoin" valueBlock={\`$\${marketData.bitcoin ? formatCurrency(marketData.bitcoin) : '—'}\`}>
            <Bitcoin className="h-3.5 w-3.5" />
          </ColIcon>
          <ColIcon color="hover:text-indigo-400" tooltipKey="ethereum" valueBlock={\`$\${marketData.ethereum ? formatCurrency(marketData.ethereum) : '—'}\`}>
            <span className="text-[10px] font-bold">Ξ</span>
          </ColIcon>

          {/* Row 7: Ganancia | Pérdida */}
          <ColIcon color="hover:text-success" tooltipKey="totalGain" valueBlock={\`$\${totalReturn >= 0 ? formatCurrency(totalReturn) : '—'}\`}>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </ColIcon>
          <ColIcon color="hover:text-error" tooltipKey="totalLoss" valueBlock={\`$\${totalReturn < 0 ? formatCurrency(Math.abs(totalReturn)) : '—'}\`}>
            <ArrowDownRight className="h-3.5 w-3.5" />
          </ColIcon>`
);

// 4. Replace individual titles in Expanded view
// Profit
content = content.replace(
  `<div className="flex items-center gap-1.5 mb-1">
            <ArrowUpRight className="h-3 w-3 text-success" />
            <span className="text-[10px] font-medium text-text-muted uppercase">Ganancia</span>
          </div>`,
  `<ExpandedTitle icon={ArrowUpRight} text="Ganancia" tooltipKey="totalGain" className="mb-1 text-success" />`
);
// Loss
content = content.replace(
  `<div className="flex items-center gap-1.5 mb-1">
            <ArrowDownRight className="h-3 w-3 text-error" />
            <span className="text-[10px] font-medium text-text-muted uppercase">Pérdida</span>
          </div>`,
  `<ExpandedTitle icon={ArrowDownRight} text="Pérdida" tooltipKey="totalLoss" className="mb-1 text-error" />`
);
// UF
content = content.replace(
  `<div className="flex items-center gap-1.5 mb-1">
            <CircleDollarSign className="h-3 w-3 text-warning" />
            <span className="text-[10px] font-medium text-text-muted uppercase">UF</span>
          </div>`,
  `<ExpandedTitle icon={CircleDollarSign} text="UF" tooltipKey="uf" className="mb-1 text-warning" />`
);
// UTM
content = content.replace(
  `<div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] font-bold text-purple-400 leading-none">UTM</span>
            <span className="text-[10px] font-medium text-text-muted uppercase">CLP</span>
          </div>`,
  `<ExpandedTitle iconNode={<span className="text-[9px] font-bold text-purple-400 leading-none">UTM</span>} text="CLP" tooltipKey="utm" className="mb-1" />`
);
// EUR
content = content.replace(
  `<div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-bold text-sky-400">€</span>
            <span className="text-[10px] font-medium text-text-muted uppercase">EUR</span>
          </div>`,
  `<ExpandedTitle iconNode={<span className="text-[11px] font-bold text-sky-400">€</span>} text="EUR" tooltipKey="eur" className="mb-1" />`
);
// USD
content = content.replace(
  `<div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="h-3 w-3 text-success" />
            <span className="text-[10px] font-medium text-text-muted uppercase">USD</span>
          </div>`,
  `<ExpandedTitle icon={DollarSign} text="USD" tooltipKey="usd" className="mb-1 text-success" />`
);
// NASDAQ
content = content.replace(
  `<div className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold text-emerald-400 tracking-tight">NDQ</span>
              <span className="text-[10px] font-medium text-text-muted uppercase">Nasdaq</span>
            </div>`,
  `<ExpandedTitle iconNode={<span className="text-[8px] font-bold text-emerald-400 tracking-tight">NDQ</span>} text="Nasdaq" tooltipKey="nasdaq" />`
);
// OIL
content = content.replace(
  `<div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-amber-500">OIL</span>
              <span className="text-[10px] font-medium text-text-muted uppercase">WTI</span>
            </div>`,
  `<ExpandedTitle iconNode={<span className="text-[9px] font-bold text-amber-500">OIL</span>} text="WTI" tooltipKey="wti" />`
);
// Gold
content = content.replace(
  `<div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-warning" />
              <span className="text-[10px] font-medium text-text-muted uppercase">Oro</span>
            </div>`,
  `<ExpandedTitle icon={TrendingUp} text="Oro" tooltipKey="gold" className="text-warning" />`
);
// Silver
content = content.replace(
  `<div className="flex items-center gap-1.5">
              <Circle className="h-3 w-3 text-blue-400" />
              <span className="text-[10px] font-medium text-text-muted uppercase">Plata</span>
            </div>`,
  `<ExpandedTitle icon={Circle} text="Plata" tooltipKey="silver" className="text-blue-400" />`
);
// Copper
content = content.replace(
  `<div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-orange-400">CU</span>
              <span className="text-[10px] font-medium text-text-muted uppercase">Cobre</span>
            </div>`,
  `<ExpandedTitle iconNode={<span className="text-[9px] font-bold text-orange-400">CU</span>} text="Cobre" tooltipKey="copper" />`
);
// Lithium
content = content.replace(
  `<div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-teal-400">Li</span>
              <span className="text-[10px] font-medium text-text-muted uppercase">Litio</span>
            </div>`,
  `<ExpandedTitle iconNode={<span className="text-[9px] font-bold text-teal-400">Li</span>} text="Litio" tooltipKey="lithium" />`
);
// BTC
content = content.replace(
  `<div className="flex items-center gap-1.5 mb-1">
            <Bitcoin className="h-3 w-3 text-orange-500" />
            <span className="text-[10px] font-medium text-text-muted uppercase">BTC</span>
          </div>`,
  `<ExpandedTitle icon={Bitcoin} text="BTC" tooltipKey="bitcoin" className="mb-1 text-orange-500" />`
);
// ETH
content = content.replace(
  `<div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold text-indigo-400">Ξ</span>
            <span className="text-[10px] font-medium text-text-muted uppercase">ETH</span>
          </div>`,
  `<ExpandedTitle iconNode={<span className="text-[10px] font-bold text-indigo-400">Ξ</span>} text="ETH" tooltipKey="ethereum" className="mb-1" />`
);

fs.writeFileSync('src/components/MarketDataTicker.tsx', content);
console.log('Modification completed');

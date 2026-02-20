import { useState, useMemo } from 'react'
import {
  Calculator,
  TrendingUp,
  BarChart3,
  Plus,
  Download,
  Building2,
  Trees,
  ChevronDown,
  Filter,
  CheckCircle,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle
} from 'lucide-react'
import {
  SAMPLE_CREDITS,
  SAMPLE_LANDS,
  CreditScenario,
  LandOpportunity,
  LandCreditCombo,
  analyzeLandCreditCombo,
  compareScenarios,
  calculateEffectiveCredit
} from '../lib/landCredit'
import { formatCurrency } from '../lib/utils'
import {
  CreditTruthRevealer,
  LandCreditComboCard,
  ComparisonTable,
  LandCard,
  CreditCard,
  AdvancedMetricsDashboard,
  MarketDataPanel
} from '../components/CreditAnalysis'
import { HelpTooltip, LabelWithTooltip, INVESTMENT_TOOLTIPS } from '../components/HelpTooltip'

type Tab = 'overview' | 'compare' | 'lands' | 'credits' | 'calculator' | 'analysis'

// Money Card Component - New Design
function MoneyCard({
  title,
  amount,
  subtitle,
  trend,
  trendValue,
  highlight = false,
  currency = 'CLP'
}: {
  title: string
  amount: number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  highlight?: boolean
  currency?: string
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-text-muted'
  
  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 card-hover ${
      highlight 
        ? 'bg-cream/5 border-cream/20' 
        : 'bg-surface border-border'
    }`}>
      <p className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-2">{title}</p>
      <p className={`font-mono text-2xl font-semibold ${highlight ? 'text-cream' : 'text-text-primary'}`}>
        {currency === '%' ? `${amount.toFixed(1)}%` : formatCurrency(amount)}
      </p>
      {subtitle && (
        <p className="text-xs text-text-muted mt-1">{subtitle}</p>
      )}
      {trend && TrendIcon && trendValue && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  )
}

export default function LandAnalyzer() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [selectedLand, setSelectedLand] = useState<LandOpportunity | null>(null)
  const [selectedCredit, setSelectedCredit] = useState<CreditScenario | null>(null)
  
  const [customLand, setCustomLand] = useState<Partial<LandOpportunity>>({
    askingPrice: 25000000,
    landAreaSquareMeters: 1000,
    appraisalValue: 30000000,
    expectedAppreciationAnnual: 7,
    zoning: 'residential',
    hasBasicServices: true,
    hasRoadAccess: true,
  })
  
  const [customCredit, setCustomCredit] = useState<Partial<CreditScenario>>({
    advertisedCreditAmount: 30000000,
    requiredDownPayment: 6000000,
    annualInterestRate: 4.19,
    termYears: 20,
    notaryFees: 100000,
    registrationFees: 180000,
    appraisalFee: 100000,
    insuranceFees: 180000,
    stampTax: 48000,
    otherFees: 50000,
    isDFL2: true,
  })

  const allLands = useMemo(() => [...SAMPLE_LANDS], [])
  const allCredits = useMemo(() => [...SAMPLE_CREDITS], [])

  const allCombos = useMemo(() => {
    const combos: LandCreditCombo[] = []
    for (const land of allLands) {
      for (const credit of allCredits) {
        combos.push({
          land,
          credit,
          analysis: analyzeLandCreditCombo(land, credit)
        })
      }
    }
    return combos
  }, [allLands, allCredits])

  const comparison = useMemo(() => compareScenarios(allCombos), [allCombos])

  const currentCombo = useMemo(() => {
    if (!selectedLand || !selectedCredit) return null
    return {
      land: selectedLand,
      credit: selectedCredit,
      analysis: analyzeLandCreditCombo(selectedLand, selectedCredit)
    }
  }, [selectedLand, selectedCredit])
  
  const _selectedComboInfo = currentCombo ? `${currentCombo.land.name} + ${currentCombo.credit.name}` : 'No selection'
  void _selectedComboInfo

  const customAnalysis = useMemo(() => {
    if (!customLand.askingPrice || !customCredit.advertisedCreditAmount) return null
    
    const land: LandOpportunity = {
      id: 'custom',
      name: 'Terreno Personalizado',
      location: { region: 'Custom', city: 'Custom', commune: 'Custom' },
      askingPrice: customLand.askingPrice,
      landAreaSquareMeters: customLand.landAreaSquareMeters || 1000,
      pricePerSquareMeter: (customLand.askingPrice || 0) / (customLand.landAreaSquareMeters || 1000),
      appraisalValue: customLand.appraisalValue || customLand.askingPrice,
      belowAppraisalBy: customLand.appraisalValue 
        ? ((customLand.appraisalValue - customLand.askingPrice) / customLand.appraisalValue) * 100
        : 0,
      zoning: customLand.zoning || 'residential',
      hasBasicServices: customLand.hasBasicServices || false,
      hasRoadAccess: customLand.hasRoadAccess || false,
      topography: 'flat',
      expectedAppreciationAnnual: customLand.expectedAppreciationAnnual || 7,
      status: 'analyzing',
      listingDate: new Date().toISOString(),
      notes: ''
    }
    
    const credit: CreditScenario = {
      id: 'custom',
      name: 'Crédito Personalizado',
      bank: 'Personalizado',
      advertisedCreditAmount: customCredit.advertisedCreditAmount,
      requiredDownPayment: customCredit.requiredDownPayment || 0,
      effectiveCreditAmount: calculateEffectiveCredit(
        customCredit.advertisedCreditAmount,
        customCredit.requiredDownPayment || 0
      ),
      annualInterestRate: customCredit.annualInterestRate || 4.19,
      termYears: customCredit.termYears || 20,
      notaryFees: customCredit.notaryFees || 100000,
      registrationFees: customCredit.registrationFees || 180000,
      appraisalFee: customCredit.appraisalFee || 100000,
      insuranceFees: customCredit.insuranceFees || 180000,
      stampTax: customCredit.stampTax || 48000,
      otherFees: customCredit.otherFees || 50000,
      ufValueAtPurchase: 39740,
      currency: 'CLP',
      isDFL2: customCredit.isDFL2 ?? true,
      requiredMonthlyIncome: 1800000,
      maxPaymentToIncomeRatio: 0.25
    }
    
    return { land, credit, analysis: analyzeLandCreditCombo(land, credit) }
  }, [customLand, customCredit])

  const tabs = [
    { id: 'overview' as Tab, label: 'Resumen', icon: BarChart3 },
    { id: 'analysis' as Tab, label: 'Análisis Detallado', icon: Target },
    { id: 'compare' as Tab, label: 'Comparar', icon: TrendingUp },
    { id: 'lands' as Tab, label: 'Terrenos', icon: Trees },
    { id: 'credits' as Tab, label: 'Créditos', icon: Building2 },
    { id: 'calculator' as Tab, label: 'Calculadora', icon: Calculator },
  ]

  return (
    <div className="space-y-6 fade-in">
      {/* Tabs */}
      <div className="border-b border-border -mx-4 px-4 sm:mx-0 sm:px-0">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-3 sm:py-4 px-3 sm:px-4 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 flex-shrink-0
                  ${activeTab === tab.id
                    ? 'border-cream text-cream'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                  }
                `}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pb-8">
        {activeTab === 'overview' && (
          <OverviewTab comparison={comparison} allCombos={allCombos} />
        )}

        {activeTab === 'compare' && <CompareTab comparison={comparison} />}
        {activeTab === 'lands' && (
          <LandsTab 
            lands={allLands}
            selectedLand={selectedLand}
            onSelectLand={setSelectedLand}
          />
        )}
        {activeTab === 'credits' && (
          <CreditsTab 
            credits={allCredits}
            selectedCredit={selectedCredit}
            onSelectCredit={setSelectedCredit}
          />
        )}
        {activeTab === 'analysis' && (
          <AnalysisTab 
            selectedLand={selectedLand}
            selectedCredit={selectedCredit}
            allLands={allLands}
            allCredits={allCredits}
            onSelectLand={setSelectedLand}
            onSelectCredit={setSelectedCredit}
          />
        )}
        {activeTab === 'calculator' && (
          <CalculatorTab 
            customLand={customLand}
            setCustomLand={setCustomLand}
            customCredit={customCredit}
            setCustomCredit={setCustomCredit}
            customAnalysis={customAnalysis}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ 
  comparison, 
  allCombos
}: { 
  comparison: ReturnType<typeof compareScenarios>
  allCombos: LandCreditCombo[]
}) {
  const topScored = allCombos.slice().sort((a, b) => b.analysis.score - a.analysis.score).slice(0, 5)
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MoneyCard
          title="Mejor ROI 5 Años"
          amount={comparison.bestByROI?.analysis.roi5Year || 0}
          trend="up"
          trendValue={comparison.bestByROI ? comparison.bestByROI.land.name : 'N/A'}
          currency="%"
        />
        <MoneyCard
          title="Menor Pago Mensual"
          amount={comparison.bestByMonthlyPayment?.analysis.monthlyPayment || 0}
          subtitle="Mejor flujo de caja"
        />
        <MoneyCard
          title="Menos Efectivo Requerido"
          amount={comparison.bestByCashRequired?.analysis.cashRequired || 0}
          subtitle="Menor barrera de entrada"
        />
        <MoneyCard
          title="Mejor Puntaje"
          amount={comparison.bestOverall?.analysis.score || 0}
          highlight
          trend="up"
          trendValue={comparison.bestOverall ? comparison.bestOverall.land.name : 'N/A'}
          currency="pts"
        />
      </div>

      {/* Best Option Detail */}
      {comparison.bestOverall && (
        <div className="relative overflow-hidden rounded-2xl border border-success/20 bg-success-dim p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-success" />
            <h2 className="text-xl font-bold text-success">Mejor Oportunidad Detectada</h2>
          </div>
          <LandCreditComboCard combo={comparison.bestOverall} isBest />
        </div>
      )}

      {/* Top 5 Rankings */}
      <div>
        <h3 className="text-sm font-semibold tracking-widest text-cream-muted uppercase mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Top 5 Oportunidades
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {topScored.map((combo, index) => (
            <LandCreditComboCard 
              key={`${combo.land.id}-${combo.credit.id}`} 
              combo={combo}
              className={index === 0 ? 'ring-2 ring-success/50' : ''}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPARE TAB
// ============================================================================

function CompareTab({ comparison }: { comparison: ReturnType<typeof compareScenarios> }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">Comparación de Todas las Combinaciones</h2>
        <div className="flex gap-2">
          <button className="glyph-btn glyph-btn-ghost">
            <Filter className="h-4 w-4" />
            Filtrar
          </button>
          <button className="glyph-btn glyph-btn-ghost">
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Winners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparison.bestByROI && (
          <div className="rounded-2xl border border-success/20 bg-success-dim p-4">
            <p className="text-xs font-semibold tracking-widest text-success uppercase mb-2">Mejor ROI</p>
            <LandCreditComboCard combo={comparison.bestByROI} />
          </div>
        )}
        {comparison.bestByMonthlyPayment && (
          <div className="rounded-2xl border border-info/20 bg-info-dim p-4">
            <p className="text-xs font-semibold tracking-widest text-info uppercase mb-2">Menor Pago</p>
            <LandCreditComboCard combo={comparison.bestByMonthlyPayment} />
          </div>
        )}
        {comparison.bestByCashRequired && (
          <div className="rounded-2xl border border-cream/20 bg-cream/5 p-4">
            <p className="text-xs font-semibold tracking-widest text-cream uppercase mb-2">Menos Efectivo</p>
            <LandCreditComboCard combo={comparison.bestByCashRequired} />
          </div>
        )}
      </div>

      {/* Full Comparison Table */}
      <ComparisonTable combos={comparison.scenarios} />
    </div>
  )
}

// ============================================================================
// LANDS TAB
// ============================================================================

function LandsTab({ 
  lands, 
  selectedLand, 
  onSelectLand 
}: { 
  lands: LandOpportunity[]
  selectedLand: LandOpportunity | null
  onSelectLand: (land: LandOpportunity) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Terrenos Disponibles</h2>
          <p className="text-sm text-text-muted mt-1">{lands.length} oportunidades analizadas</p>
        </div>
        <button className="glyph-btn glyph-btn-primary">
          <Plus className="h-4 w-4" />
          Agregar Terreno
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {lands.map((land) => (
          <LandCard
            key={land.id}
            land={land}
            isSelected={selectedLand?.id === land.id}
            onClick={() => onSelectLand(land)}
          />
        ))}
      </div>

      {selectedLand && (
        <div className="glass-card-elevated p-6 mt-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">Detalles del Terreno</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface">
              <p className="text-xs text-text-muted uppercase mb-1">Precio</p>
              <p className="font-mono text-lg font-semibold text-text-primary">{formatCurrency(selectedLand.askingPrice)}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface">
              <p className="text-xs text-text-muted uppercase mb-1">Valor Tasación</p>
              <p className="font-mono text-lg font-semibold text-cream">{formatCurrency(selectedLand.appraisalValue)}</p>
              <p className="text-xs text-text-muted mt-1">{selectedLand.belowAppraisalBy}% diferencia</p>
            </div>
            <div className="p-4 rounded-xl bg-surface">
              <p className="text-xs text-text-muted uppercase mb-1">Precio/m²</p>
              <p className="font-mono text-lg font-semibold text-text-primary">{formatCurrency(selectedLand.pricePerSquareMeter)}/m²</p>
            </div>
            <div className="p-4 rounded-xl bg-surface">
              <p className="text-xs text-text-muted uppercase mb-1">Apreciación Esperada</p>
              <p className="font-mono text-lg font-semibold text-success">{selectedLand.expectedAppreciationAnnual}%/año</p>
            </div>
          </div>
          {selectedLand.notes && (
            <div className="mt-4 p-4 rounded-xl bg-surface">
              <h4 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-2">Notas</h4>
              <p className="text-sm text-text-secondary">{selectedLand.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// CREDITS TAB
// ============================================================================

function CreditsTab({ 
  credits, 
  selectedCredit, 
  onSelectCredit 
}: { 
  credits: CreditScenario[]
  selectedCredit: CreditScenario | null
  onSelectCredit: (credit: CreditScenario) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Créditos Hipotecarios</h2>
          <p className="text-sm text-text-muted mt-1">{credits.length} créditos analizados</p>
        </div>
        <button className="glyph-btn glyph-btn-primary">
          <Plus className="h-4 w-4" />
          Agregar Crédito
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {credits.map((credit) => (
          <CreditCard
            key={credit.id}
            credit={credit}
            isSelected={selectedCredit?.id === credit.id}
            onClick={() => onSelectCredit(credit)}
          />
        ))}
      </div>

      {selectedCredit && (
        <div className="mt-6">
          <CreditTruthRevealer credit={selectedCredit} />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ANALYSIS TAB
// ============================================================================

function AnalysisTab({ 
  selectedLand, 
  selectedCredit,
  allLands,
  allCredits,
  onSelectLand,
  onSelectCredit
}: { 
  selectedLand: LandOpportunity | null
  selectedCredit: CreditScenario | null
  allLands: LandOpportunity[]
  allCredits: CreditScenario[]
  onSelectLand: (land: LandOpportunity) => void
  onSelectCredit: (credit: CreditScenario) => void
}) {
  const currentCombo = useMemo(() => {
    if (!selectedLand || !selectedCredit) return null
    return {
      land: selectedLand,
      credit: selectedCredit,
      analysis: analyzeLandCreditCombo(selectedLand, selectedCredit)
    }
  }, [selectedLand, selectedCredit])

  const land = selectedLand || allLands[0]
  const credit = selectedCredit || allCredits[0]
  const combo = currentCombo || {
    land,
    credit,
    analysis: analyzeLandCreditCombo(land, credit)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Selection */}
        <div className="space-y-6">
          {/* Land Selection */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-3 flex items-center gap-2">
              <Trees className="h-4 w-4" />
              Seleccionar Terreno
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allLands.map((l) => (
                <button
                  key={l.id}
                  onClick={() => onSelectLand(l)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                    land.id === l.id
                      ? 'bg-cream/10 border border-cream/20'
                      : 'bg-surface border border-border hover:border-border-strong'
                  }`}
                >
                  <p className="font-medium text-text-primary truncate">{l.name}</p>
                  <p className="text-xs text-text-muted">{formatCurrency(l.askingPrice)} • {l.location.commune}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Credit Selection */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold tracking-widest text-cream-muted uppercase mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Seleccionar Crédito
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allCredits.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCredit(c)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                    credit.id === c.id
                      ? 'bg-cream/10 border border-cream/20'
                      : 'bg-surface border border-border hover:border-border-strong'
                  }`}
                >
                  <p className="font-medium text-text-primary">{c.bank}</p>
                  <p className="text-xs text-text-muted">{c.annualInterestRate}% • {c.termYears} años {c.isDFL2 && '• DFL2'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Market Data */}
          <MarketDataPanel />
        </div>

        {/* Right Panel - Analysis */}
        <div className="lg:col-span-2">
          <AdvancedMetricsDashboard combo={combo} />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// CALCULATOR TAB
// ============================================================================

function CalculatorTab({
  customLand,
  setCustomLand,
  customCredit,
  setCustomCredit,
  customAnalysis
}: {
  customLand: Partial<LandOpportunity>
  setCustomLand: (land: Partial<LandOpportunity>) => void
  customCredit: Partial<CreditScenario>
  setCustomCredit: (credit: Partial<CreditScenario>) => void
  customAnalysis: LandCreditCombo | null
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-info/20 bg-info-dim p-5">
        <h3 className="font-semibold text-info flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Custom Calculator
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Enter your own data to analyze any land and credit combination.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Land Form */}
        <div className="glass-card-elevated p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-text-primary">
            <Trees className="h-5 w-5 text-success" />
            Datos del Terreno
          </h3>
          <div className="space-y-4">
            <div>
              <LabelWithTooltip
                label="Sale Price (CLP)"
                tooltipContent={INVESTMENT_TOOLTIPS.askingPrice.content}
                tooltipExample={INVESTMENT_TOOLTIPS.askingPrice.example}
              />
              <input
                type="number"
                value={customLand.askingPrice}
                onChange={(e) => setCustomLand({ ...customLand, askingPrice: Number(e.target.value) })}
                className="input-field mt-2"
              />
            </div>
            <div>
              <LabelWithTooltip
                label="Area (m²)"
                tooltipContent="El tamaño del terreno en metros cuadrados. Se usa para calcular el precio por m² y comparar oportunidades."
                tooltipExample="1,000 m² es un terreno pequeño (1/10 hectárea). 5,000 m² es un terreno estándar para una casa grande."
              />
              <input
                type="number"
                value={customLand.landAreaSquareMeters}
                onChange={(e) => setCustomLand({ ...customLand, landAreaSquareMeters: Number(e.target.value) })}
                className="input-field mt-2"
              />
            </div>
            <div>
              <LabelWithTooltip
                label="Appraisal Value (CLP)"
                tooltipContent={INVESTMENT_TOOLTIPS.appraisalValue.content}
                tooltipExample={INVESTMENT_TOOLTIPS.appraisalValue.example}
              />
              <input
                type="number"
                value={customLand.appraisalValue}
                onChange={(e) => setCustomLand({ ...customLand, appraisalValue: Number(e.target.value) })}
                className="input-field mt-2"
              />
            </div>
            <div>
              <LabelWithTooltip
                label="Expected Appreciation (%/year)"
                tooltipContent={INVESTMENT_TOOLTIPS.expectedAppreciation.content}
                tooltipExample={INVESTMENT_TOOLTIPS.expectedAppreciation.example}
              />
              <input
                type="number"
                step="0.1"
                value={customLand.expectedAppreciationAnnual}
                onChange={(e) => setCustomLand({ ...customLand, expectedAppreciationAnnual: Number(e.target.value) })}
                className="input-field mt-2"
              />
            </div>
            <div>
              <LabelWithTooltip
                label="Zoning"
                tooltipContent={INVESTMENT_TOOLTIPS.zoningType.content}
                tooltipExample={INVESTMENT_TOOLTIPS.zoningType.example}
              />
              <select
                value={customLand.zoning}
                onChange={(e) => setCustomLand({ ...customLand, zoning: e.target.value as any })}
                className="input-field mt-2"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="agricultural">Agricultural</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Credit Form */}
        <div className="glass-card-elevated p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-text-primary">
            <Building2 className="h-5 w-5 text-info" />
            Datos del Crédito
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-warning/20 bg-warning-dim">
              <LabelWithTooltip
                label='"Advertised" Amount (CLP)'
                tooltipTitle="Advertised Amount"
                tooltipContent="El monto que el banco publicita en sus avisos. NO es lo que realmente recibes. Siempre es mayor que el efectivo real."
                tooltipExample='Banco dice "Crédito hipotecario $100 millones" pero luego te cobran fees y exigen pie.'
              />
              <input
                type="number"
                value={customCredit.advertisedCreditAmount}
                onChange={(e) => setCustomCredit({ ...customCredit, advertisedCreditAmount: Number(e.target.value) })}
                className="input-field border-warning/30 mt-2"
              />
              <p className="text-xs text-warning mt-1">What the bank advertises</p>
            </div>
            <div className="p-4 rounded-xl border border-error/20 bg-error-dim">
              <LabelWithTooltip
                label="Required Down Payment (CLP)"
                tooltipTitle="Down Payment (Pie)"
                tooltipContent={INVESTMENT_TOOLTIPS.downPayment.content}
                tooltipExample={INVESTMENT_TOOLTIPS.downPayment.example}
              />
              <input
                type="number"
                value={customCredit.requiredDownPayment}
                onChange={(e) => setCustomCredit({ ...customCredit, requiredDownPayment: Number(e.target.value) })}
                className="input-field border-error/30 mt-2"
              />
              <p className="text-xs text-error mt-1">What you MUST pay in cash</p>
            </div>
            <div>
              <LabelWithTooltip
                label="Annual Interest Rate (%)"
                tooltipTitle="Interest Rate"
                tooltipContent={INVESTMENT_TOOLTIPS.interestRate.content}
                tooltipExample={INVESTMENT_TOOLTIPS.interestRate.example}
              />
              <input
                type="number"
                step="0.1"
                value={customCredit.annualInterestRate}
                onChange={(e) => setCustomCredit({ ...customCredit, annualInterestRate: Number(e.target.value) })}
                className="input-field mt-2"
              />
            </div>
            <div>
              <LabelWithTooltip
                label="Term (years)"
                tooltipTitle="Loan Term"
                tooltipContent={INVESTMENT_TOOLTIPS.termYears.content}
                tooltipExample={INVESTMENT_TOOLTIPS.termYears.example}
              />
              <input
                type="number"
                value={customCredit.termYears}
                onChange={(e) => setCustomCredit({ ...customCredit, termYears: Number(e.target.value) })}
                className="input-field mt-2"
              />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success-dim border border-success/20">
              <input
                type="checkbox"
                id="isDFL2"
                checked={customCredit.isDFL2}
                onChange={(e) => setCustomCredit({ ...customCredit, isDFL2: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <label htmlFor="isDFL2" className="text-sm text-success font-medium cursor-pointer flex items-center gap-2">
                Aplica beneficio DFL2 (ahorro 0.6% en impuesto al mutuo)
                <HelpTooltip
                  title="DFL2 Benefit"
                  content={INVESTMENT_TOOLTIPS.dfl2.content}
                  example={INVESTMENT_TOOLTIPS.dfl2.example}
                  size="sm"
                />
              </label>
            </div>

            <details className="group">
              <summary className="cursor-pointer text-sm text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors">
                <ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />
                Gastos Operacionales Detallados
                <HelpTooltip
                  title="Operational Expenses"
                  content={INVESTMENT_TOOLTIPS.operationalExpenses.content}
                  example={INVESTMENT_TOOLTIPS.operationalExpenses.example}
                  size="sm"
                />
              </summary>
              <div className="mt-3 space-y-3">
                {[
                  { key: 'notaryFees', label: 'Gastos Notariales', hint: '~UF 2.5', tooltip: INVESTMENT_TOOLTIPS.notaryFees },
                  { key: 'registrationFees', label: 'Inscripción CBR', hint: '~UF 2.5', tooltip: INVESTMENT_TOOLTIPS.registrationFees },
                  { key: 'appraisalFee', label: 'Tasación', hint: '~UF 2.5', tooltip: INVESTMENT_TOOLTIPS.appraisalFee },
                  { key: 'insuranceFees', label: 'Seguros', hint: 'Desgravamen + Incendio', tooltip: INVESTMENT_TOOLTIPS.insuranceFees },
                  { key: 'stampTax', label: `Impuesto al Mutuo (${customCredit.isDFL2 ? '0.2%' : '0.8%'})`, hint: customCredit.isDFL2 ? 'Ahorro con DFL2' : 'Normal', tooltip: INVESTMENT_TOOLTIPS.stampTax },
                  { key: 'otherFees', label: 'Otros gastos', hint: 'Gestión, etc.' },
                ].map(({ key, label, hint, tooltip }) => {
                  const numValue = customCredit[key as keyof typeof customCredit]
                  return (
                    <div key={key}>
                      {tooltip ? (
                        <LabelWithTooltip
                          label={label}
                          tooltipContent={tooltip.content}
                          tooltipExample={(tooltip as any).example}
                        />
                      ) : (
                        <label className="block text-xs text-text-muted mb-1">
                          {label}
                          <span className="text-text-muted/60 ml-1">({hint})</span>
                        </label>
                      )}
                      <input
                        type="number"
                        value={typeof numValue === 'number' ? numValue : 0}
                        onChange={(e) => setCustomCredit({ ...customCredit, [key]: Number(e.target.value) })}
                        className="input-field mt-1"
                      />
                    </div>
                  )
                })}
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Results */}
      {customAnalysis && (
        <div className="space-y-6">
          <div className="glass-card-elevated p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">Resultado del Análisis</h3>
            <LandCreditComboCard combo={customAnalysis} />
          </div>
          
          {/* Advanced Metrics */}
          <AdvancedMetricsDashboard combo={customAnalysis} />
          
          {customAnalysis.analysis.score >= 70 && (
            <div className="bg-success-dim border border-success/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <p className="font-semibold text-success">¡Excelente oportunidad!</p>
                <p className="text-sm text-text-secondary">
                  Esta combinación ofrece buenos retornos con riesgo calculado.
                </p>
              </div>
            </div>
          )}
          
          {customAnalysis.analysis.score < 50 && (
            <div className="bg-warning-dim border border-warning/20 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <div>
                <p className="font-semibold text-warning">Revisar con precaución</p>
                <p className="text-sm text-text-secondary">
                  Esta combinación presenta indicadores de riesgo. Considera alternativas.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Land & Credit Analysis Engine
 * Sophisticated financial calculator for Chilean real estate investments
 * Exposes hidden costs and true credit amounts
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CreditScenario {
  id: string
  name: string
  bank: string
  // Advertised vs Reality
  advertisedCreditAmount: number // What the bank claims (e.g., 30M)
  requiredDownPayment: number // What you must pay upfront (e.g., 6M)
  effectiveCreditAmount: number // advertised - down payment = real credit (24M)
  
  // Loan Terms
  annualInterestRate: number // Tasa (e.g., 4.6%)
  termYears: number // Plazo (e.g., 20 años)
  
  // Additional Costs (Gastos Operacionales)
  notaryFees: number // Gastos Notariales
  registrationFees: number // Inscripción CBR
  appraisalFee: number // Tasación
  insuranceFees: number // Seguros
  stampTax: number // Impuesto al Mutuo (0.8% typical)
  otherFees: number
  
  // Chile-specific
  ufValueAtPurchase: number // Valor UF al momento
  currency: 'CLP' | 'UF'
  
  // Income Requirements
  requiredMonthlyIncome: number // Renta mínima requerida
  maxPaymentToIncomeRatio: number // Typically 25-30%
}

export interface LandOpportunity {
  id: string
  name: string
  location: {
    region: string
    city: string
    commune: string
    address?: string
  }
  // Pricing
  askingPrice: number // Precio de venta
  pricePerSquareMeter: number
  landAreaSquareMeters: number
  
  // Valuation
  appraisalValue: number // Valor tasación
  belowAppraisalBy: number // % below appraisal (opportunity!)
  
  // Characteristics
  zoning: 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'mixed' | 'undefined'
  buildableArea?: number // Metros cuadrados construibles
  hasBasicServices: boolean // Luz, agua, alcantarillado
  hasRoadAccess: boolean
  topography: 'flat' | 'sloped' | 'steep' | 'irregular'
  
  // Financial Analysis
  expectedAppreciationAnnual: number // % expected annual appreciation
  estimatedRentalIncome?: number // Potential rent if developed
  
  // Status
  status: 'available' | 'under_contract' | 'sold' | 'analyzing'
  listingDate: string
  notes: string
}

export interface CreditPaymentBreakdown {
  month: number
  payment: number // Dividendo mensual
  principal: number // Amortización capital
  interest: number // Intereses
  insurance: number // Seguros
  remainingBalance: number // Saldo
}

export interface TrueCostAnalysis {
  // Immediate Out-of-Pocket
  downPayment: number
  operationalExpenses: number
  totalCashRequired: number
  
  // Credit Reality
  effectiveCredit: number
  totalInterestPaid: number
  totalInsurancePaid: number
  totalCreditCost: number // effectiveCredit + interest + insurance
  
  // Ratios & Metrics
  trueCostMultiplier: number // How many times you pay vs borrowed
  monthlyPayment: number
  paymentToIncomeRatio: number
  
  // Opportunity Cost
  downPaymentOpportunityCost: number // What that 6M could earn elsewhere
}

export interface LandCreditCombo {
  land: LandOpportunity
  credit: CreditScenario
  analysis: {
    totalInvestment: number
    monthlyPayment: number
    cashRequired: number
    roi5Year: number
    roi10Year: number
    roi20Year: number
    appreciationValue5Year: number
    appreciationValue10Year: number
    appreciationValue20Year: number
    breakEvenMonth: number // When value > total paid
    recommendation: 'strong_buy' | 'buy' | 'neutral' | 'avoid' | 'strong_avoid'
    score: number // 0-100
  }
}

export interface ComparisonResult {
  scenarios: LandCreditCombo[]
  bestByROI: LandCreditCombo | null
  bestByMonthlyPayment: LandCreditCombo | null
  bestByCashRequired: LandCreditCombo | null
  bestOverall: LandCreditCombo | null
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate the TRUE effective credit amount
 * Banks claim X but require Y upfront = you only get X-Y
 */
export function calculateEffectiveCredit(advertised: number, downPayment: number): number {
  return advertised - downPayment
}

/**
 * Calculate monthly payment (dividendo) using Chilean mortgage formula
 * Uses compound interest calculation
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 100 / 12
  const numPayments = years * 12
  
  if (monthlyRate === 0) {
    return principal / numPayments
  }
  
  const payment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  
  return Math.round(payment)
}

/**
 * Generate full amortization schedule
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  years: number,
  monthlyInsurance: number = 0
): CreditPaymentBreakdown[] {
  const monthlyRate = annualRate / 100 / 12
  const numPayments = years * 12
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years)
  
  const schedule: CreditPaymentBreakdown[] = []
  let balance = principal
  
  for (let month = 1; month <= numPayments; month++) {
    const interest = balance * monthlyRate
    const principalPaid = monthlyPayment - interest
    balance = Math.max(0, balance - principalPaid)
    
    schedule.push({
      month,
      payment: Math.round(monthlyPayment + monthlyInsurance),
      principal: Math.round(principalPaid),
      interest: Math.round(interest),
      insurance: Math.round(monthlyInsurance),
      remainingBalance: Math.round(balance)
    })
  }
  
  return schedule
}

/**
 * Calculate TRUE cost of credit including all hidden expenses
 */
export function calculateTrueCost(credit: CreditScenario): TrueCostAnalysis {
  const effectiveCredit = calculateEffectiveCredit(
    credit.advertisedCreditAmount,
    credit.requiredDownPayment
  )
  
  const operationalExpenses = 
    credit.notaryFees + 
    credit.registrationFees + 
    credit.appraisalFee + 
    credit.insuranceFees + 
    credit.stampTax + 
    credit.otherFees
  
  const totalCashRequired = credit.requiredDownPayment + operationalExpenses
  
  const schedule = generateAmortizationSchedule(
    effectiveCredit,
    credit.annualInterestRate,
    credit.termYears
  )
  
  const totalInterestPaid = schedule.reduce((sum, p) => sum + p.interest, 0)
  const totalInsurancePaid = schedule.reduce((sum, p) => sum + p.insurance, 0)
  const monthlyPayment = schedule[0]?.payment || 0
  
  const totalCreditCost = effectiveCredit + totalInterestPaid + totalInsurancePaid
  const trueCostMultiplier = totalCreditCost / effectiveCredit
  
  // Opportunity cost: what the down payment could earn at 8% annual
  const downPaymentOpportunityCost = credit.requiredDownPayment * 
    (Math.pow(1.08, credit.termYears) - 1)
  
  return {
    downPayment: credit.requiredDownPayment,
    operationalExpenses,
    totalCashRequired,
    effectiveCredit,
    totalInterestPaid,
    totalInsurancePaid,
    totalCreditCost,
    trueCostMultiplier,
    monthlyPayment,
    paymentToIncomeRatio: credit.requiredMonthlyIncome > 0 
      ? monthlyPayment / credit.requiredMonthlyIncome 
      : 0,
    downPaymentOpportunityCost: Math.round(downPaymentOpportunityCost)
  }
}

/**
 * Calculate total investment analysis for land + credit combo
 */
export function analyzeLandCreditCombo(
  land: LandOpportunity,
  credit: CreditScenario
): LandCreditCombo['analysis'] {
  const trueCost = calculateTrueCost(credit)
  
  // If land price exceeds effective credit, need more cash
  const additionalCashNeeded = Math.max(0, land.askingPrice - trueCost.effectiveCredit)
  const totalCashRequired = trueCost.totalCashRequired + additionalCashNeeded
  const totalInvestment = totalCashRequired + trueCost.totalCreditCost
  
  // Appreciation projections
  const appreciationValue5Year = land.askingPrice * 
    Math.pow(1 + land.expectedAppreciationAnnual / 100, 5)
  const appreciationValue10Year = land.askingPrice * 
    Math.pow(1 + land.expectedAppreciationAnnual / 100, 10)
  const appreciationValue20Year = land.askingPrice * 
    Math.pow(1 + land.expectedAppreciationAnnual / 100, 20)
  
  // ROI calculations
  const roi5Year = ((appreciationValue5Year - totalInvestment) / totalCashRequired) * 100
  const roi10Year = ((appreciationValue10Year - totalInvestment) / totalCashRequired) * 100
  const roi20Year = ((appreciationValue20Year - totalInvestment) / totalCashRequired) * 100
  
  // Break-even analysis
  let breakEvenMonth = 0
  let accumulatedPayment = totalCashRequired
  for (let month = 1; month <= credit.termYears * 12; month++) {
    accumulatedPayment += trueCost.monthlyPayment
    const currentValue = land.askingPrice * 
      Math.pow(1 + land.expectedAppreciationAnnual / 100, month / 12)
    if (currentValue > accumulatedPayment) {
      breakEvenMonth = month
      break
    }
  }
  
  // Scoring algorithm
  let score = 50 // Base score
  
  // Price opportunity bonus
  if (land.belowAppraisalBy > 20) score += 15
  else if (land.belowAppraisalBy > 10) score += 10
  else if (land.belowAppraisalBy > 5) score += 5
  
  // ROI bonus
  if (roi5Year > 50) score += 15
  else if (roi5Year > 30) score += 10
  else if (roi5Year > 15) score += 5
  
  // Monthly payment affordability
  const paymentToPrice = trueCost.monthlyPayment / land.askingPrice
  if (paymentToPrice < 0.005) score += 10 // Less than 0.5% monthly
  else if (paymentToPrice < 0.007) score += 5
  
  // Cash required penalty
  if (totalCashRequired > land.askingPrice * 0.4) score -= 10
  else if (totalCashRequired > land.askingPrice * 0.3) score -= 5
  
  // Zoning bonus
  if (land.zoning === 'residential' || land.zoning === 'commercial') score += 5
  if (land.hasBasicServices && land.hasRoadAccess) score += 5
  
  score = Math.max(0, Math.min(100, score))
  
  // Recommendation
  let recommendation: LandCreditCombo['analysis']['recommendation']
  if (score >= 80) recommendation = 'strong_buy'
  else if (score >= 65) recommendation = 'buy'
  else if (score >= 45) recommendation = 'neutral'
  else if (score >= 25) recommendation = 'avoid'
  else recommendation = 'strong_avoid'
  
  return {
    totalInvestment: Math.round(totalInvestment),
    monthlyPayment: trueCost.monthlyPayment,
    cashRequired: Math.round(totalCashRequired),
    roi5Year: Math.round(roi5Year * 100) / 100,
    roi10Year: Math.round(roi10Year * 100) / 100,
    roi20Year: Math.round(roi20Year * 100) / 100,
    appreciationValue5Year: Math.round(appreciationValue5Year),
    appreciationValue10Year: Math.round(appreciationValue10Year),
    appreciationValue20Year: Math.round(appreciationValue20Year),
    breakEvenMonth,
    recommendation,
    score
  }
}

/**
 * Compare multiple land + credit scenarios
 */
export function compareScenarios(combos: LandCreditCombo[]): ComparisonResult {
  if (combos.length === 0) {
    return {
      scenarios: [],
      bestByROI: null,
      bestByMonthlyPayment: null,
      bestByCashRequired: null,
      bestOverall: null
    }
  }
  
  return {
    scenarios: combos,
    bestByROI: combos.reduce((best, current) => 
      current.analysis.roi5Year > best.analysis.roi5Year ? current : best
    ),
    bestByMonthlyPayment: combos.reduce((best, current) => 
      current.analysis.monthlyPayment < best.analysis.monthlyPayment ? current : best
    ),
    bestByCashRequired: combos.reduce((best, current) => 
      current.analysis.cashRequired < best.analysis.cashRequired ? current : best
    ),
    bestOverall: combos.reduce((best, current) => 
      current.analysis.score > best.analysis.score ? current : best
    )
  }
}

// ============================================================================
// SAMPLE DATA GENERATORS
// ============================================================================

export const SAMPLE_CREDITS: CreditScenario[] = [
  {
    id: 'bancoestado-30m-20y',
    name: 'Crédito Hipotecario 30M',
    bank: 'BancoEstado',
    advertisedCreditAmount: 30000000,
    requiredDownPayment: 6000000,
    effectiveCreditAmount: 24000000,
    annualInterestRate: 4.6,
    termYears: 20,
    notaryFees: 500000,
    registrationFees: 250000,
    appraisalFee: 350000,
    insuranceFees: 150000,
    stampTax: 192000, // 0.8% of 24M
    otherFees: 100000,
    ufValueAtPurchase: 39728,
    currency: 'CLP',
    requiredMonthlyIncome: 1800000,
    maxPaymentToIncomeRatio: 0.25
  },
  {
    id: 'bancoestado-30m-15y',
    name: 'Crédito Hipotecario 30M (15 años)',
    bank: 'BancoEstado',
    advertisedCreditAmount: 30000000,
    requiredDownPayment: 6000000,
    effectiveCreditAmount: 24000000,
    annualInterestRate: 4.6,
    termYears: 15,
    notaryFees: 500000,
    registrationFees: 250000,
    appraisalFee: 350000,
    insuranceFees: 150000,
    stampTax: 192000,
    otherFees: 100000,
    ufValueAtPurchase: 39728,
    currency: 'CLP',
    requiredMonthlyIncome: 2200000,
    maxPaymentToIncomeRatio: 0.25
  },
  {
    id: 'bancochile-25m-20y',
    name: 'Crédito Hipotecario 25M',
    bank: 'Banco de Chile',
    advertisedCreditAmount: 25000000,
    requiredDownPayment: 5000000,
    effectiveCreditAmount: 20000000,
    annualInterestRate: 4.4,
    termYears: 20,
    notaryFees: 450000,
    registrationFees: 230000,
    appraisalFee: 400000,
    insuranceFees: 180000,
    stampTax: 160000,
    otherFees: 120000,
    ufValueAtPurchase: 39728,
    currency: 'CLP',
    requiredMonthlyIncome: 1500000,
    maxPaymentToIncomeRatio: 0.25
  },
  {
    id: 'santander-35m-25y',
    name: 'Crédito Hipotecario 35M',
    bank: 'Banco Santander',
    advertisedCreditAmount: 35000000,
    requiredDownPayment: 7000000,
    effectiveCreditAmount: 28000000,
    annualInterestRate: 4.8,
    termYears: 25,
    notaryFees: 550000,
    registrationFees: 280000,
    appraisalFee: 380000,
    insuranceFees: 200000,
    stampTax: 224000,
    otherFees: 110000,
    ufValueAtPurchase: 39728,
    currency: 'CLP',
    requiredMonthlyIncome: 2000000,
    maxPaymentToIncomeRatio: 0.25
  }
]

export const SAMPLE_LANDS: LandOpportunity[] = [
  {
    id: 'land-001',
    name: 'Parcela Los Robles - Concepción',
    location: {
      region: 'Biobío',
      city: 'Concepción',
      commune: 'San Pedro de la Paz'
    },
    askingPrice: 28000000,
    pricePerSquareMeter: 28000,
    landAreaSquareMeters: 1000,
    appraisalValue: 35000000,
    belowAppraisalBy: 20,
    zoning: 'residential',
    buildableArea: 600,
    hasBasicServices: true,
    hasRoadAccess: true,
    topography: 'flat',
    expectedAppreciationAnnual: 8,
    estimatedRentalIncome: 350000,
    status: 'available',
    listingDate: '2026-02-01',
    notes: 'Excelente ubicación, servicios básicos disponibles, ideal para construcción'
  },
  {
    id: 'land-002',
    name: 'Terreno El Mirador - Chiguayante',
    location: {
      region: 'Biobío',
      city: 'Chiguayante',
      commune: 'Chiguayante'
    },
    askingPrice: 22000000,
    pricePerSquareMeter: 22000,
    landAreaSquareMeters: 1000,
    appraisalValue: 26000000,
    belowAppraisalBy: 15.4,
    zoning: 'residential',
    buildableArea: 500,
    hasBasicServices: false,
    hasRoadAccess: true,
    topography: 'sloped',
    expectedAppreciationAnnual: 7,
    estimatedRentalIncome: 280000,
    status: 'available',
    listingDate: '2026-01-15',
    notes: 'Vista panorámica, requiere extensión de servicios'
  },
  {
    id: 'land-003',
    name: 'Parcela Industrial - Hualpén',
    location: {
      region: 'Biobío',
      city: 'Hualpén',
      commune: 'Hualpén'
    },
    askingPrice: 45000000,
    pricePerSquareMeter: 15000,
    landAreaSquareMeters: 3000,
    appraisalValue: 50000000,
    belowAppraisalBy: 10,
    zoning: 'industrial',
    buildableArea: 2000,
    hasBasicServices: true,
    hasRoadAccess: true,
    topography: 'flat',
    expectedAppreciationAnnual: 6,
    estimatedRentalIncome: 600000,
    status: 'available',
    listingDate: '2026-02-10',
    notes: 'Zona industrial, alta plusvalía histórica'
  },
  {
    id: 'land-004',
    name: 'Terreno Agrícola - Yumbel',
    location: {
      region: 'Biobío',
      city: 'Yumbel',
      commune: 'Yumbel'
    },
    askingPrice: 18000000,
    pricePerSquareMeter: 6000,
    landAreaSquareMeters: 3000,
    appraisalValue: 20000000,
    belowAppraisalBy: 10,
    zoning: 'agricultural',
    hasBasicServices: false,
    hasRoadAccess: true,
    topography: 'flat',
    expectedAppreciationAnnual: 5,
    status: 'available',
    listingDate: '2026-01-20',
    notes: 'Tierra fértil, ideal para agricultura o loteo futuro'
  }
]

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

export function formatCurrency(amount: number, currency: string = 'CLP'): string {
  if (currency === 'CLP') {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(amount)
  }
  return new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount) + ' UF'
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }).format(value / 100)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-CL').format(num)
}

export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function monthsToYearsMonths(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (years === 0) return `${months} meses`
  if (months === 0) return `${years} años`
  return `${years} años ${months} meses`
}

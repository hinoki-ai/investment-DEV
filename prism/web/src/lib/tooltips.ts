// ============================================================================
// BASE DE DATOS DE TOOLTIPS - Términos de Inversión para Noobs (Español)
// ============================================================================

export type TooltipItem = {
    title: string;
    content: string;
    example?: string;
};

const _INVESTMENT_TOOLTIPS = {
    // Categorías
    category: {
        title: 'Categoría',
        content: 'El tipo de activo en el que inviertes. Cada categoría tiene diferentes riesgos, retornos y estructura fiscal.',
        example: 'Los terrenos suelen apreciar de forma constante; las criptomonedas son más volátiles pero con mayor potencial de retorno.',
    },

    // Info básica
    name: {
        title: 'Nombre de la Inversión',
        content: 'Un identificador claro para administrar esta inversión en tu portafolio.',
        example: '"Departamento Playa Floripa" o "Acciones Apple"',
    },

    status: {
        title: 'Estado',
        content: 'La situación actual del activo. Te ayuda a organizar si está activo, vendido o en un periodo de transacción.',
        example: 'Activo = Lo mantienes hoy; Pendiente = En proceso; Vendido = Ya liquidaste.',
    },

    description: {
        title: 'Descripción',
        content: 'Notas adicionales que te ayuden a documentar características clave de tu activo.',
        example: 'Cerca de futura línea de metro, necesita remodelación mayor, etc.',
    },

    tags: {
        title: 'Etiquetas',
        content: 'Palabras clave para filtrar y organizar tu portafolio con mayor agilidad.',
        example: 'riesgo moderado, jubilación, renta, diversificación',
    },

    // Financiero
    purchasePrice: {
        title: 'Precio de Compra',
        content: 'El costo total de adquisición, incluyendo los gastos iniciales y comisiones del broker.',
        example: 'Si compras a $100k y pagas $5k en trámites, el precio final de compra es $105,000.',
    },

    currentValue: {
        title: 'Valor Actual',
        content: 'La valorización estimada nominalmente hoy para monitorear ganancias o pérdidas de tu patrimonio neto (equity).',
        example: 'Puedes utilizar comparables de mercado o valores de tasación oficial.',
    },

    purchaseDate: {
        title: 'Fecha de Compra',
        content: 'La fecha exacta de adquisición. Es fundamental para poder calcular retornos y flujos anualizados.',
    },

    ownershipPercentage: {
        title: 'Porcentaje de Propiedad',
        content: 'La fracción de participación (equity) del activo que te pertenece legalmente en esquemas societarios o de co-inversión.',
        example: 'Si inviertes 50/50 con un socio estratégico, tu porcentaje es 50%.',
    },

    // Land específico
    landArea: {
        title: 'Superficie (Hectáreas)',
        content: 'El área total del terreno. Útil para calcular el precio por metro cuadrado comparativo.',
        example: '1 hectárea (10,000 m²) permite evaluar el potencial del predio en zonificación rústica.',
    },

    zoningType: {
        title: 'Zonificación',
        content: 'El uso de suelo permitido (residencial, comercial, agrícola/forestal, mixto), definido por el plan regulador municipal o estatal.',
    },

    // Ubicación
    address: {
        title: 'Dirección física',
        content: 'La ubicación exacta in-situ. Indispensable para localizar el polígono topográfico o validar documentación.',
    },

    city: {
        title: 'Ciudad',
        content: 'Criterio geográfico a nivel municipal para aislar riesgos regionales en el análisis de portafolio.',
    },

    state: {
        title: 'Región / Estado',
        content: 'División macro en la que reside la inversión. Cada una puede tener incentivos fiscales distintos.',
    },

    country: {
        title: 'País',
        content: 'El mercado de tu activo. Fundamental para calcular exposición cambiaria y riesgos soberanos (sovereign risk).',
    },

    // Dashboard/Stats
    totalValue: {
        title: 'Valor Total del Portafolio',
        content: 'El valor de mercado combinado de la totalidad de tu inventario o Assets Under Management (AUM).',
        example: 'Efectivo $50k + Tierra $100k = Valor Total de $150k.',
    },

    returnPercentage: {
        title: 'Retorno %',
        content: 'El porcentaje de rentabilidad acumulada, calculada sobre el capital total aportado.',
    },

    // Crédito/Hipotecario
    downPayment: {
        title: 'Pie o Enganche',
        content: 'El capital propio inicial inyectado (equity injection) sobre el valor estructurado comercial.',
        example: 'Un pie del 10% en $200k significa inyectar $20k de tu liquidez y apalancarte con $180k del banco.',
    },

    interestRate: {
        title: 'Tasa de Interés',
        content: 'Tasa de costo base del crédito pactada. Impacta de forma importante la rentabilidad a medida que el interés compuesto escala.',
    },

    termYears: {
        title: 'Plazo (Años)',
        content: 'Periodo definido para amortizar el capital. Un plazo corto aumenta la cuota mensual pero reduce drásticamente el costo financiero acumulado.',
        example: 'A 30 años, los pagos iniciales corresponden en su gran mayoría a cobertura de intereses, no a capital.',
    },

    monthlyPayment: {
        title: 'Cuota Mensual / Dividendo',
        content: 'Es la obligación base recurrente pactada (carga amortizable). Incluye capital, cálculo de interés y normalmente los seguros adicionales.',
    },

    dfl2: {
        title: 'Exención DFL2',
        content: 'Beneficio fiscal chileno (DFL-2) que reduce fuertemente arancel y derechos de impuesto al mutuo para proyectos habitacionales específicos.',
    },

    effectiveCredit: {
        title: 'Crédito Efectivo',
        content: 'El capital nominal neto inyectado por el banco, restándole al total hipotecado tus gastos de solicitud o comisiones de originación.',
        example: 'Un banco puede aprobar 1500 UF, pero entregarte 1480 UF efectivos tras deducir los gastos operacionales.',
    },

    operationalExpenses: {
        title: 'Gastos Operacionales',
        content: 'Desembolsos iniciales de gestión no amortizables: tasaciones escriturales, gastos notariales e inscripciones conservatorias.',
    },

    // Métricas avanzadas
    roi: {
        title: 'Retorno sobre la Inversión (ROI)',
        content: 'Rentabilidad porcentual directa, sobre el costo base invertido, sin descontar factores temporales.',
    },

    irr: {
        title: 'Tasa Interna de Retorno (TIR / IRR)',
        content: 'El parámetro de rendimiento de inversión por excelencia. Descuenta y ajusta la rentabilidad considerando el momento exacto en el ciclo temporal en que ocurren los flujos.',
        example: 'Recibir todo el retorno temprano mejorará radicalmente tu TIR frente a recibirlo al final del plazo.',
    },

    ltv: {
        title: 'Loan-to-Value (LTV)',
        content: 'Porcentaje de la tasación del activo que está siendo financiado a través de la deuda avalada, definiendo tu cuota de apalancamiento (leverage).',
        example: 'Un LTV financiero conservador suele ser el 80%; opciones sobre el 95% exigen primas de riesgo mayores.',
    },

    dscr: {
        title: 'Cobertura de Servicio de Deuda (DSCR)',
        content: 'Relaciona la rentabilidad o ganancia mensual recurrente y liquida frente la cuota hipotecaria mensual comprometida.',
        example: 'DSCR < 1 significa que tus flujos pasivos no logran cubrir las cuotas, debiendo inyectar más capital.',
    },

    capRate: {
        title: 'Tasa de Capitalización (Cap Rate)',
        content: 'El potencial de Renta Neta Operativa si no tuvieras deuda vinculada. Refleja las utilidades anuales proyectadas antes de cubrir impuestos e intereses (NOI) como porcentaje del valor total del proyecto.',
    },

    cashOnCash: {
        title: 'Rentabilidad Cash-on-Cash',
        content: 'Determina el retorno líquido basado exclusivamente en el capital directo que pagaste desde el bolsillo, aislando el capital de deuda de la ecuación.',
    },

    // Análisis
    confidenceScore: {
        title: 'Nivel de Confianza (IA)',
        content: 'Indica el grado de certeza del modelo algorítmico al interpretar documentos legales complejos para digitalizarlos.',
        example: 'Un 85% significa que la transcripción es altamente congruente con los patrones entrenados de Machine Learning.',
    },

    score: {
        title: 'Calificación del Portafolio',
        content: 'Ponderación agregada transversal del perfil global de riesgo y la rentabilidad esperada considerando variables como LTV y métricas de ganancia ponderadas.',
    },

    breakEven: {
        title: 'Punto de Equilibrio (Break-Even)',
        content: 'El momento en horizonte temporal donde has acumulado tanto en valor como rentas para netear la cuantía inicial desembolsada o cubrir todas las minusvalías.',
    },

    // Archivos
    fileStatus: {
        title: 'Procesamiento e Ingestión',
        content: 'Muestra si tus documentos han completado la indexación y transcripción a cargo de los motores distribuidos de IA analítica.',
    },

    // Campos de calculadora específicos
    askingPrice: {
        title: 'Precio de Mercado / Solicitado',
        content: 'La cotización publicitaria o precio lista sugerido para marcar un punto base de negociación y abrir las contra-ofertas.',
    },

    appraisalValue: {
        title: 'Valor de Tasación (Appraisal)',
        content: 'La evaluación pericial definitiva empleada por instituciones financieras que fijan el techo para medir las garantías reales.',
    },

    pricePerSquareMeter: {
        title: 'Precio por m²',
        content: 'Fórmula que consolida y estandariza las escalas geográficas para contrastar con referencias paramétricas competitivas en costo de unidad territorial.',
    },

    expectedAppreciation: {
        title: 'Plusvalía Proyectada (Appreciation)',
        content: 'Cálculo de apreciación esperada inherente a fuerzas de mercado y valorización por densidad a futuro, ignorando ampliaciones constructivas añadidas de forma privada.',
    },

    // Gastos operacionales
    notaryFees: {
        title: 'Desembolsos Notariales',
        content: 'Honorarios administrativos asociados a ministros de fe en protocolizaciones de transferencias patrimoniales legales y promesas.',
    },

    registrationFees: {
        title: 'Derechos Conservatorios (CBR)',
        content: 'Gestión registral proporcional abonada en Chile, otorgando estatus jurídico formal a tu inscripción de dominio patrimonial de Bienes Raíces.',
    },

    appraisalFee: {
        title: 'Costo de Tasación',
        content: 'Pago administrativo a oficinas valorizadoras que inspeccionan los collaterals a favor del banco financista durante aprobaciones hipotecarias.',
    },

    insuranceFees: {
        title: 'Pólizas de Seguros Asignadas',
        content: 'Cobros recurrentes mandatarios (Incendio/Sismo/Desgravamen) que blindan pasivos contingentes y que se endosan contractualmente a favor del acreedor principal.',
    },

    stampTax: {
        title: 'Impuesto de Timbres (y Estampillas)',
        content: 'Arancel estatal aplicado formalmente como gravamen sobre instrumentos de emisión de crédito emitidos o notarizados.',
    },

    // Métricas de análisis land+credit
    cashRequired: {
        title: 'Liquidez / Capital Requerido',
        content: 'La suma líquida o desembolso monetario inicial total de la operación (incluye todo gasto basal, enganches y comisiones) para poder consolidar tu adquisición legal del colateral ("Closing Cost").',
    },

    trueCost: {
        title: 'Costo Final Bruto',
        content: 'Acumulación nominal que revela el peso del crédito extendido: es la sumatoria entre el valor suscrito, intereses absolutos y gastos agregados, ilustrando cómo los sobrecostos absorben tus rentabilidades nominalmente sobre el horizonte del mismo.',
    },

    equityMultiple: {
        title: 'Multiplicador Patrimonial (Equity Multiple)',
        content: 'Indica mediante un ratio total aritmético cuánto de tu capital inicial se generará progresivamente o fue validado, fundamental en estructuras de Private Equity ("Retorno Múltiple de Liquidez Invertida").',
    },

    paybackPeriod: {
        title: 'Plazo de Recuperación (Payback Period)',
        content: 'Umbral puro que cronometra de regreso tu monto original hundido a partir de utilidades pasivas, priorizando el conteo de flujos mensuales líquidos del modelo a consolidar.',
    },

    taxBenefit: {
        title: 'Alivio Tributario Automático',
        content: 'Las provisiones normativas que rebajan utilidades por conceptos de intereses devengados hipotecarios de la base gravable impositiva para la declaración global como contraprestación fiscal.',
    },

    // Indicadores Económicos
    uf: {
        title: 'Unidad de Fomento (UF)',
        content: 'Índice referencial chileno estructurado sistémicamente que se reajusta respecto a márgenes inflacionarios (IPC), usado para anclar de facto valorizaciones financieras reales sostenibles.',
    },
    utm: {
        title: 'Unidad Tributaria Mensual (UTM)',
        content: 'Acuerdo estandarizado oficial sobre la escala de pagos impositivos y sanciones gubernamentales indexadas al avance de los periodos de liquidación.',
    },
    eur: {
        title: 'Euro (€)',
        content: 'Reserva compartida del espacio europeo e indicador de alta liquidez frente al Dólar, actuando como contrapeso que atenúa el riesgo central sobre tu base de dinero fiat.',
    },
    usd: {
        title: 'Dólar de los Estados Unidos (USD)',
        content: 'Divisa base y primigenia del ecosistema global. Es una protección o "Hedge" de rigor insustituible a incorporar como paraguas para contrarrestar devaluaciones regionales.',
    },
    nasdaq: {
        title: 'Índice NASDAQ-100',
        content: 'Agrupa el core bursátil americano para empresas líderes de vanguardia en Tech y ciencias; refleja muy acertadamente la inclinación por el capital en crecimiento global corporativo (Growth Investing).',
    },
    wti: {
        title: 'Petróleo WTI (Crudo)',
        content: 'Indicador de factor de coste fundamental frente a fletes navieros o industriales a escala que encarece de manera expansiva inflaciones residuales que arrastran el panorama de insumos mundial en su conjunto.',
    },
    gold: {
        title: 'Oro Físico y Títulos (Au)',
        content: 'Mecanismo anti-inflacionario que ejerce un resguardo sistémico, por ser intrínsecamente finito, frente al deterioro endémico programado de ecosistemas fiat gubernamentales (Safe-Haven asset).',
    },
    silver: {
        title: 'Plata (Ag)',
        content: 'Metal ambivalente debido a la dicotomía principal al operar tanto en perfiles de capital refugio como en el sector hiper-industrial (sistemas fotovoltaicos, conductores) sumamente acoplado al crecimiento logístico y la manufactura tecnológica futura.',
    },
    copper: {
        title: 'Cobre Refinado (Cu)',
        content: 'Exposición inamovible frente al boom constructivo intercontinental y las redes vehiculares del mañana (Electrificación masiva). Un metal altamente procíclico directamente anclado a balances macro de crecimiento.',
    },
    lithium: {
        title: 'Alineación de Litio (Li)',
        content: 'Pilar incuestionable de los metales para almacenamiento general, exponiendo tus posiciones íntegramente de cara hacia soluciones de suministro y redes automovilísticas o factorías que re-dirigen su infraestructura desde el crudo hacia renovables globales (EV/Storage Solutions).',
    },
    bitcoin: {
        title: 'Red Bitcoin (BTC)',
        content: 'Red monetaria apolítica global. Basada en rigidez programada criptográficamente estricta respecto a su emisión a perpetuidad, permitiendo transferencia directa y descentralizada sirviendo cada vez de colateral absoluto.',
    },
    ethereum: {
        title: 'Contratos Ethereum (ETH)',
        content: 'Plataforma descentralizada o motor computacional que automatiza garantías y aplicaciones complejas que funcionan ininterrumpidamente, propulsadas por un subyacente que entrega capacidad operaria (Staking Tokens).',
    },
    totalGain: {
        title: 'Rentabilidad Nominal',
        content: 'Representación tangible de excedentes a tu favor sin considerar flujos de caja y sólo validando la diferencia natural apreciable por posesión de mercado transaccional (Paper Gain real sobre capitalización o precio de las posiciones).',
    },
    totalLoss: {
        title: 'Minusvalía o Retroceso (Drawdown)',
        content: 'El diferencial que afecta y quema patrimonios consolidados reportando caídas valorizadoras que debilitan márgenes bases tolerados, incidiendo en posibles liquidaciones anticipadas en cuentas a margen si tienes coberturas o requerimientos (Margin Calls transitorios o permanentes).',
    },
}

export const INVESTMENT_TOOLTIPS: Record<keyof typeof _INVESTMENT_TOOLTIPS, TooltipItem> = _INVESTMENT_TOOLTIPS;

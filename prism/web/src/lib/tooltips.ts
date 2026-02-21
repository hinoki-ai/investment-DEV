// ============================================================================
// BASE DE DATOS DE TOOLTIPS - Términos de Inversión para Noobs (Español)
// ============================================================================

export const INVESTMENT_TOOLTIPS = {
    // Categorías
    category: {
        title: 'Categoría',
        content: 'El tipo de activo en el que inviertes. Cada categoría tiene diferentes riesgos, retornos y estructura fiscal.',
        example: 'Terrenos suelen apreciar lento pero seguro; Cripto es más volátil pero con retornos más altos.',
    },

    // Info básica
    name: {
        title: 'Nombre de la Inversión',
        content: 'Un nombre descriptivo para identificar rápidamente esta inversión en tu portafolio.',
        example: '"Departamento Playa Floripa" o "Acciones Apple"',
    },

    status: {
        title: 'Estado (Status)',
        content: 'El estatus actual del activo. Te ayuda a saber si está activo, vendido o en transición transaccional.',
        example: 'Activo = Lo mantienes hoy; Pendiente = En proceso; Vendido = Ya liquidaste.',
    },

    description: {
        title: 'Descripción',
        content: 'Cualquier nota adicional que te ayude a recordar características o detalles clave de tu activo.',
        example: 'Cerca de futura línea de metro, necesita remodelación mayor, etc.',
    },

    tags: {
        title: 'Etiquetas (Tags)',
        content: 'Palabras clave para filtrar y organizar tu portafolio con mayor agilidad.',
        example: 'riesgoso, jubilación, renta, diversificar',
    },

    // Financiero
    purchasePrice: {
        title: 'Precio de Compra (Purchase Price)',
        content: 'Cuánto te costó adquirirlo base, incluyendo los costos iniciales, comisiones y gastos del broker.',
        example: 'Compraste a $100k y pagaste $5k en trámites, el precio de compra es $105,000.',
    },

    currentValue: {
        title: 'Valor Actual',
        content: 'Cuánto vale nominalmente esa inversión hoy para monitorear ganancias o pérdidas de tu equity.',
        example: 'Puedes usar comparables o valores de tasación oficial (Appraisal).',
    },

    purchaseDate: {
        title: 'Fecha de Compra',
        content: 'Cuándo adquiriste y cerraste deal. Es clave para calcular retornos y flujos anualizados.',
    },

    ownershipPercentage: {
        title: 'Porcentaje de Propiedad',
        content: 'Qué fracción en equity del activo te pertenece nominal y legalmente, vs tus co-inversionistas u otros stakeholders.',
        example: 'Inviertes 50/50 con un socio estratégico = 50%.',
    },

    // Land específico
    landArea: {
        title: 'Superficie (Hectáreas)',
        content: 'El área bruta del terreno. Sirve para calcular precio por metro cuadrado comparativo.',
        example: '1 hectárea (10,000 m²) representa approx. un cuarto de una hectárea tradicional en zonificación rústica.',
    },

    zoningType: {
        title: 'Zonificación',
        content: 'El uso normativo permitido (residencial, comercial, agrícola/forestal, mixto), definido por planos y planes reguladores del gobierno o municipalidades.',
    },

    // Ubicación
    address: {
        title: 'Dirección física',
        content: 'La ubicación exacta in-situ. Útil para localizar polígonos o validar documentación ex-post.',
    },

    city: {
        title: 'Ciudad',
        content: 'Criterio geográfico subnacional para aislar riesgos sistémicos de la comuna en el análisis de portafolio.',
    },

    state: {
        title: 'Región / Estado',
        content: 'Región macro en la que reside la inversión. Cada una puede impactarse por incentivos locales distintos.',
    },

    country: {
        title: 'País',
        content: 'Mercado de tu activo. Fundamental para calcular exposición cambiaria, riesgos fiscales foráneos y sovereign risk.',
    },

    // Dashboard/Stats
    totalValue: {
        title: 'Valor Total del Portafolio',
        content: 'El valor de mercado combinado de tu inventario (Asset Net Worth o AUM).',
        example: 'Liquidez $50k + Tierra $100k = Portfolio Value Total de $150k.',
    },

    returnPercentage: {
        title: 'Retorno %',
        content: 'Cuánto porcentaje de rentabilidad acumulada total tienes desde el inicio del asset allocation.',
    },

    // Crédito/Hipotecario
    downPayment: {
        title: 'Pie (Down Payment)',
        content: 'El capital inyectado como enganche inicial (equity injection) sobre el valor estructurado comercial.',
        example: '10% de pie en $200k significa poner tu liquidity de $20k y apalancarte con $180k del banco.',
    },

    interestRate: {
        title: 'Tasa de Interés Anualizada',
        content: 'Tasa de costo base del crédito pactada (interest rate). Modifica abismalmente la rentabilidad si las tasas compuestas escalan.',
    },

    termYears: {
        title: 'Plazo (Mortgage Term)',
        content: 'Años para amortizar el capital. Reducirlo aumenta el dividendo pero corta exponencialmente el pago de intereses adosados.',
        example: 'A 30 años la amortización se siente casi enteramente como pago puro de tasa bancaria los primeros años.',
    },

    monthlyPayment: {
        title: 'Dividendo Mensual',
        content: 'Es tu obligación base recurrente (cuota mensual hipotecaria o carga amortizable). Incluye capital + interés (y a menudo seguros integrados).',
    },

    dfl2: {
        title: 'Exención DFL2',
        content: 'Estatuto habitacional y beneficio de la autoridad fiscal en Chile (DFL-2) que reduce fuertemente arancel y derechos de impuesto al mutuo o timbres.',
    },

    effectiveCredit: {
        title: 'Crédito Efectivo',
        content: 'La inyección nominal final entregada en el banco. Restándole al total hipotecado tus gastos y requerimientos "on top".',
        example: 'Un banco puede emitir 1500 UF de crédito, pero deducirá comisiones en caja, otorgándote neto 1480 UF efectivos.',
    },

    operationalExpenses: {
        title: 'Gastos Operacionales',
        content: 'Los onerosos desembolsos iniciales no amortizables: notarías, estudios de título corporativos, inscripciones conservatorias y peritos tasadores.',
    },

    // Métricas avanzadas
    roi: {
        title: 'Retorno sobre Inversión (ROI)',
        content: 'Retorno porcentual universal con respecto a tu inversión del total del activo sin descuento temporal.',
    },

    irr: {
        title: 'Tasa Interna de Retorno (TIR / IRR)',
        content: 'El termómetro de rentabilidad profesional (internal rate of return). Castiga la dilación en recibir las rentas asumiendo el Timing y costo oportunidad de tu dinero futuro (Discount Rate).',
        example: 'Doble de ganancia a 10 años es peor de ratio TIR que misma ganancia ganada íntegramente de retorno al mes dos.',
    },

    ltv: {
        title: 'Loan-to-Value (LTV)',
        content: 'Proporción porcentual del activo cubierto en base a deuda vs patrimonio. Determina de facto el nivel de apalancamiento riesgoso tolerado por la banca de inversión.',
        example: 'Un préstamo con LTV 80% es más fácil de lograr que un agresivo 95% que exige primas adicionales.',
    },

    dscr: {
        title: 'Debt Service Coverage Ratio (DSCR)',
        content: 'El margen real de supervivencia si el esquema opera con rentas. Relaciona Rentabilidad Neta y Gasto Fijo Bancario de deuda servible.',
        example: 'DSCR < 1 significa que necesitas rescatar dinero externo mensual para soportar al banco.',
    },

    capRate: {
        title: 'Tasa de Capitalización (Cap Rate)',
        content: 'Tu métrica madre de "Renta Perpetua Asumida sin deuda en Real Estate". Ganancias integrales Netas (NOI) como porcentaje del Costo Fijo bruto del proyecto actual.',
    },

    cashOnCash: {
        title: 'Rentabilidad Cash-on-Cash',
        content: 'Tu ROI modificado que solo pesa desde el bolsillo (solo el efectivo real pagado), lo mejor indicativo de flujos constantes para los adictos al dividendo accionario o inmobiliario.',
    },

    // Análisis
    confidenceScore: {
        title: 'Score de Confianza de Inteligencia IA',
        content: 'El intervalo analítico de Machine Learning al indexar contratos poco legibles y asegurar qué tan acertada o confiable es la estructura mostrada.',
        example: '85% es una transcripción casi transparente y perfecta del algoritmo sobre el activo subido.',
    },

    score: {
        title: 'Rating / Score del Portafolio',
        content: 'Benchmark ponderado cruzadamente entre métricas rentables como el TIR y el riesgo estructural derivado del Loan-to-Value + liquidez inherente y momentum.',
    },

    breakEven: {
        title: 'Punto de Equilibrio (Break-Even)',
        content: 'La franja de meses o años hasta lograr anular toda minusvalía operacional en un empate "Tablas" neteado a la inversión acumulada hundida.',
    },

    // Archivos
    fileStatus: {
        title: 'Procesamiento e Ingestión',
        content: 'Indica si tus repositorios y notas en formato PDF pasaron por el nodo central automatizado neuronal en el Cloud y finalizó con un Análisis.',
    },

    // Campos de calculadora específicos
    askingPrice: {
        title: 'Precio Listado Inicial (Asking Price)',
        content: 'La solicitud inflada comercial e imperfecta por defecto impuesta en la negociación para arrancar a tasar en serio y hacer low-balling estructurado y justo.',
    },

    appraisalValue: {
        title: 'Valoración Tasada (Appraisal)',
        content: 'El valor técnico conservador visado a menudo en firmas de peritaje que fundamentan el valor de piso o respaldo del colateral frente al mutuo bancario.',
    },

    pricePerSquareMeter: {
        title: 'Precio por m²',
        content: 'Estandarizando extensiones geográficas frente al metraje puro (square-meter equivalent price) en UF o CLP.',
    },

    expectedAppreciation: {
        title: 'Plusvalía Subyacente Proyectada',
        content: 'Expectativa razonable analítica que tenderá el ciclo macroeconómico natural para revalorizar al alza sin injerencia constructiva adicional del desarrollador.',
    },

    // Gastos operacionales
    notaryFees: {
        title: 'Diligencias Notariales',
        content: 'Costes fijos transaccionales de ministros de fe en las transferencias soberanas, promesas bilaterales o escrituraciones crediticias notarizadas.',
    },

    registrationFees: {
        title: 'Derechos CBR',
        content: 'Tasas pagadas en proporción al capital traspasado al registro central civil chileno del Conservador de Bienes Raíces. Otorga al título solidez universal y pública.',
    },

    appraisalFee: {
        title: 'Fee de Peritaje de Tasación',
        content: 'Costo fijo (usualmente un par de UF) para solventar a entidades valuadoras bancarias externas u outsorcing que verifiquen tasación presencial de colaterales y garantías.',
    },

    insuranceFees: {
        title: 'Primas de Pólizas Asignadas',
        content: 'Desgravamen de deudores, Sismos obligatorios o Incendios endosados a favor y en guarda bancaria. Aportan protección de pasivos no controlables.',
    },

    stampTax: {
        title: 'Impuesto de Timbres Fiscal',
        content: 'Arancel estipulado legalmente que encarece proporcionalmente emitir deudas por pagar (mutuos) y gravámenes formales hipotecantes en toda transacción.',
    },

    // Métricas de análisis land+credit
    cashRequired: {
        title: 'Fondos de Capital Propio Requeridos',
        content: 'Masa monetaria tangible obligatoria que inyectarás desde depósitos bancarios frente al "closing cost" (el gap total). Pie, más todos los intermediarios e impuestos que se pagan sin excepción al instante en notaría.',
    },

    trueCost: {
        title: 'Costo Monetario Real Total',
        content: 'Sumando la vida útil total de tus flujos al capital adeudado: una muestra bruta de cuánto más caros son los endeudamientos largos y los intereses engordados sumando además varianzas inflacionarias (UF).',
    },

    equityMultiple: {
        title: 'Multiplicador Patrimonial (Equity Multiple)',
        content: 'Razón matemática directa (x) en Private Equity para asimilar los dividendos recibidos con la plata expuesta en etapa temprana. Es tu "Factor Dinero Generado vs Riesgo Desembolsado Total".',
    },

    paybackPeriod: {
        title: 'Período en Recuperación Real (Payback)',
        content: 'Umbral cruzado y neto que toma devolver el monto inicial nominal hundido a través del sumatorio anual de liquidez, consolidando flujos mensuales sin descuento.',
    },

    taxBenefit: {
        title: 'Amortización y Alivio Tributario Automático',
        content: 'Beneficios o deducciones estipulados para deudores inversionistas chilenos sobre utilidades que deduzcan de interés pagado. Otorga blindaje al inversionista bajando pago residual anual en operaciones cruzadas de balances (Global Complementario en tributación local).',
    },

    // Indicadores Económicos
    uf: {
        title: 'Unidad de Fomento (UF)',
        content: 'Referencial único monetario (Fiat Indexed Unit) diseñado sistémicamente adosándole resguardo frente a shocks inflacionarios sobre poder el adquisitivo contable chileno (IPC). Clave para los instrumentos patrimoniales fijos no indexables de largo plazo en renta fija e inmobiliaria.',
    },
    utm: {
        title: 'TMT (Unidad Tributaria Mensual)',
        content: 'Patrón estandarizado usado impositiva o sancionatoriamente en Chile. Anclado mensualmente según la canasta general contra el IPC en el escenario de flujos.',
    },
    eur: {
        title: 'Euro CEE (€)',
        content: 'Reserva monetaria continental compartida por Europa institucional. Es una vía diversificadora al clásico USD y a menudo tiene asincrónica frente a devaluaciones estructurales pan-americanas en metales subyacentes locales.',
    },
    usd: {
        title: 'Dólar de EE.UU (USD)',
        content: 'La reserva global primaria dominante "fiat". Tradicionalmente un valor refugio inquebrantable que sirve de "Safe Haven" principal frente a una tormenta o recesión sistemática de commodities en economías menos diversificadas e importadoras de capitales.',
    },
    nasdaq: {
        title: 'NASDAQ Exchange Composite',
        content: 'La plataforma que indexa gigantes vanguardistas computacionales en USA y Biotech. Tendencia inigualable para proyectar si el capital global "VC y tecnológico" goza y empuja mercados bull con apetito de alto-riesgo e innovación (Growth vs Value investing).',
    },
    wti: {
        title: 'West Texas Intermediate (WTI Oil)',
        content: 'Grado comercial principal global en cotización de combustibles fósiles de Occidente. El componente basal más inflamable respecto a las curvas de shocks micro-inflacionarios encareciendo la logística comercial entera sobre la oferta-demanda de toda importación a tu bolsillo final.',
    },
    gold: {
        title: 'Oro Spot Market (Au)',
        content: 'Commodity tangible des-regularizado de ciclos expansivos inorgánicos que otorgan reserva natural secular (Physical Hedge Safe-Haven) y escasa cuando la fe colapsa frente al modelo fraccional accionario e impresiones inorgánicas sistémicas (QE).',
    },
    silver: {
        title: 'Plata Spot Market (Ag)',
        content: 'Oro de los "modestos" con doble filo: es un blindaje físico pero enormemente ligado al requerimiento de consumo conductor electrónico pesado post-revolución en semiconductores fotovoltaicos masivos o chips en electromovilidades que crecen en curva exponencial.',
    },
    copper: {
        title: 'Cobre Grado A (Cu)',
        content: 'Termómetro hiper-relevante e importado principal sobre infraestructura china o la salud fabril constructora global, es un pilar macro y barómetro insoslayable chileno; deprimiendo fuertemente el mercado local accionario (IPSA) frente a reveses de la demanda o super-ciclos de superávit infraestructural.',
    },
    lithium: {
        title: 'Cesta de Litio Básico (Li)',
        content: 'Tendido crucialmente a la producción global EV-Tier o Battery Supply. Representa exposición pura a flotas y almacenamiento electro-dependientes escalables globales que transitan su red troncal desde refino hidrocarburífero y suplantan redes análogicas (Energy Storage Solutions).',
    },
    bitcoin: {
        title: 'Bitcoin Cypher-Net (BTC)',
        content: 'Bancarrota contra-algorítmica digitalizada ("Oro Lógico/Computable y Escaso"), red-estado con descentralización e imposibilidad de corromper la inflación estipulada deflacionariamente para proveer colateral libre a gran escala, y anti-falsificable frente a "debasing de fiats".',
    },
    ethereum: {
        title: 'Ethereum Mainnet Token (ETH)',
        content: 'Riel informático general transnacional que cobra fees (gas tolls) sobre un mar y constelación general de aplicaciones de valor ("De-Fi", "Contratos Inequívocos y Automáticos") actuando y sustentado como token basal nativo (Yielding y Staking token).',
    },
    totalGain: {
        title: 'Rentabilidad Positiva Nominal',
        content: 'Plusvalía total generada bruta del capital consolidado apreciado orgánicamente frente al precio original adquirido; sin tomar en cuenta el apalancamiento sino asumiendo flujos consolidados de tus subyacentes en posesión.',
    },
    totalLoss: {
        title: 'Retroceso (Drawdown / Minusvalía)',
        content: 'Pérdidas de valor nominal neteadas de valoración actual vs inyección histórica de caja que reportan destrucción en el "Net Worth Equity" base en los mercados sin haber liquidado (Paper losses) pero afectando apalancamientos (Margin/LTV calls reales).',
    },
}



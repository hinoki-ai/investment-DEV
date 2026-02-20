// ============================================================================
// BASE DE DATOS DE TOOLTIPS - Términos de Inversión para Noobs (Español)
// ============================================================================

export const INVESTMENT_TOOLTIPS = {
    // Categorías
    category: {
        title: 'Category (Categoría)',
        content: 'El tipo de activo en el que inviertes. Cada categoría tiene diferentes niveles de riesgo, retornos y tratamiento fiscal.',
        example: 'Land (tierra) suele apreciar lento pero seguro. Crypto es volátil pero puede tener altos retornos.',
    },

    // Info básica
    name: {
        title: 'Investment Name',
        content: 'Un nombre descriptivo para identificar esta inversión en tu portfolio. Que sea claro para que recuerdes qué es.',
        example: '"Departamento Playa Floripa" o "Apple Stock - Broker X"',
    },

    status: {
        title: 'Status (Estado)',
        content: 'El estado actual de esta inversión. Ayuda a trackear qué activos están generando dinero activamente vs. los que están en transición.',
        example: 'Active = lo tienes ahora. Sold = lo vendiste. Pending = lo estás comprando. Under Contract = papeleo en progreso.',
    },

    description: {
        title: 'Description (Descripción)',
        content: 'Notas sobre esta inversión. Escribe cualquier cosa que te ayude a recordar detalles después - por qué lo compraste, características especiales, preocupaciones, etc.',
        example: 'Gran ubicación cerca de futura estación de metro. Vendedor motivado. Necesita renovación.',
    },

    tags: {
        title: 'Tags (Etiquetas)',
        content: 'Palabras clave para organizar y filtrar tus inversiones. Agrega cualquier label que te ayude a categorizar.',
        example: 'riesgoso, jubilación, ingreso-renta, fixer-upper, diversificar',
    },

    // Financiero
    purchasePrice: {
        title: 'Purchase Price (Precio de Compra)',
        content: 'Cuánto pagaste realmente para adquirir esta inversión. Incluye todos los costos upfront como fees, impuestos y renovaciones.',
        example: 'Si compraste tierra por $100k y pagaste $5k en fees, ingresa $105,000.',
    },

    currentValue: {
        title: 'Current Value (Valor Actual)',
        content: 'Cuánto vale esta inversión hoy. Actualiza periódicamente para trackear tus ganancias/pérdidas. Es tu mejor estimación basada en research de mercado.',
        example: 'Revisa ventas similares, valores de tasación, o precios de mercado para stocks/crypto.',
    },

    purchaseDate: {
        title: 'Purchase Date (Fecha de Compra)',
        content: 'Cuándo adquiriste esta inversión. Ayuda a calcular cuánto tiempo la has tenido y los retornos anuales.',
        example: 'Se usa para calcular: "Compré esto hace 2 años y subió 20%" = 10% por año.',
    },

    ownershipPercentage: {
        title: 'Ownership % (Porcentaje de Propiedad)',
        content: 'Qué porcentaje de este activo posees realmente. Menos de 100% significa que eres co-dueño con alguien más.',
        example: 'Si tú y tu cónyuge pusieron la mitad del dinero cada uno, cada uno posee 50%.',
    },

    // Land específico
    landArea: {
        title: 'Land Area (Superficie en hectáreas)',
        content: 'El tamaño del terreno en hectáreas. 1 hectárea = 10,000 metros cuadrados = aproximadamente 2.5 acres. Esto afecta el cálculo de precio por metro cuadrado.',
        example: 'Una cancha de fútbol es aproximadamente 0.7 hectáreas.',
    },

    zoningType: {
        title: 'Zoning Type (Zonificación)',
        content: 'Para qué está legalmente permitido usar el terreno. Lo establece la municipalidad/gobierno y afecta el valor y opciones de desarrollo.',
        example: 'Residential = solo casas. Commercial = tiendas/negocios. Mixed = ambos.',
    },

    // Ubicación
    address: {
        title: 'Address (Dirección)',
        content: 'La dirección física donde está ubicada esta inversión. Ayuda con la organización y encontrarla después.',
    },

    city: {
        title: 'City (Ciudad)',
        content: 'La ciudad o pueblo donde está ubicada esta inversión. Se usa para análisis regional y filtros.',
    },

    state: {
        title: 'State/Province (Estado/Región)',
        content: 'El estado, provincia o región donde está ubicada esta inversión. Diferentes regiones tienen diferentes reglas fiscales y condiciones de mercado.',
    },

    country: {
        title: 'Country (País)',
        content: 'El país donde está ubicada esta inversión. Importante para cambio de divisas, impuestos y consideraciones legales.',
    },

    // Dashboard/Stats
    totalValue: {
        title: 'Total Portfolio Value (Valor Total del Portfolio)',
        content: 'El valor actual combinado de todas tus inversiones ahora mismo. Este es tu net worth en inversiones.',
        example: 'Si stocks valen $50k y tierra $100k, valor total = $150k.',
    },

    returnPercentage: {
        title: 'Return % (Retorno %)',
        content: 'Cuánto ha ganado o perdido tu inversión como porcentaje. Positivo = ganancia, Negativo = pérdida.',
        example: 'Compraste por $100, ahora vale $120 = 20% retorno.',
    },

    // Crédito/Hipotecario
    downPayment: {
        title: 'Down Payment (Pie)',
        content: 'El efectivo que debes pagar upfront al comprar con crédito. El resto lo pide prestado del banco.',
        example: '10% de pie en una propiedad de $100k = $10k efectivo + $90k préstamo.',
    },

    interestRate: {
        title: 'Annual Interest Rate (Tasa de Interés Anual)',
        content: 'El porcentaje que el banco te cobra por año por pedir dinero prestado. Menor es mejor. Esto se compone (compound) con el tiempo.',
        example: '4% sobre $100k = $4,000 de interés en el año 1 (simplificado).',
    },

    termYears: {
        title: 'Loan Term (Años) (Plazo del Crédito)',
        content: 'Cuántas años tienes para pagar el préstamo. Plazos más largos = pagos mensuales más bajos pero MUCHO más interés total pagado.',
        example: '20 años vs 30 años: el pago mensual es menor con 30, pero pagas mucho más en total.',
    },

    monthlyPayment: {
        title: 'Monthly Payment (Dividendo Mensual)',
        content: 'Lo que le pagas al banco cada mes. Incluye principal (devolviendo el préstamo) + interés (fee del banco) + seguros.',
        example: 'Si el pago es $500/mes, después de 20 años habrás pagado $120,000 por un préstamo de $100k!',
    },

    dfl2: {
        title: 'DFL2 Benefit (Beneficio DFL2)',
        content: 'Un beneficio tributario chileno para compradores de primera vivienda. Reduce el impuesto al mutuo del 0.8% al 0.2%, ahorrándote dinero.',
        example: 'En un crédito de $100M CLP, el DFL2 te ahorra aproximadamente $600k CLP en impuestos.',
    },

    effectiveCredit: {
        title: 'Effective Credit (Crédito Efectivo)',
        content: 'El dinero REAL que recibes del banco después de todos los fees y pie requerido. Los bancos anuncian números más altos de lo que realmente recibes.',
        example: 'El banco dice "crédito de $100k" pero requiere $20k de pie + $5k en fees. Solo recibes $75k!',
    },

    operationalExpenses: {
        title: 'Operational Expenses (Gastos Operacionales)',
        content: 'Todos los fees y costos extras para constituir una hipoteca: notaría, inscripción, tasación, seguros, impuestos. Estos suman rápido!',
        example: 'Generalmente 2-5% del monto del préstamo en gastos.',
    },

    // Métricas avanzadas
    roi: {
        title: 'ROI - Return on Investment',
        content: 'Cuánta ganancia haces en relación a lo invertido. El número principal para comparar inversiones.',
        example: 'Inviertes $100k, vendes por $120k = 20% ROI. Haces esto en 2 años = 10% por año.',
    },

    irr: {
        title: 'IRR - Internal Rate of Return (Tasa Interna de Retorno)',
        content: 'Una forma sofisticada de calcular retorno anual que considera CUÁNDO recibes el dinero de vuelta. IRR más alto = mejor timing de inversión.',
        example: 'Recibir ganancias más pronto es mejor que después, aunque el total sea el mismo.',
    },

    ltv: {
        title: 'LTV - Loan-to-Value Ratio',
        content: 'Cuánto estás pidiendo prestado vs. lo que vale la propiedad. Más bajo = más seguro, pero requiere más efectivo upfront.',
        example: 'Propiedad vale $100k, préstamo $80k = 80% LTV.',
    },

    dscr: {
        title: 'DSCR - Debt Service Coverage Ratio',
        content: 'Puedes pagar el crédito? Compara tus ingresos contra los pagos de deuda. Los bancos quieren esto sobre 1.25x.',
        example: 'DSCR de 1.5 = tus ingresos son 1.5x tus pagos de deuda. Seguro!',
    },

    capRate: {
        title: 'Cap Rate - Capitalization Rate (Tasa de Capitalización)',
        content: 'Para propiedades de renta: ganancia anual como % del valor de la propiedad. Ayuda a comparar diferentes deals de real estate.',
        example: 'Propiedad de $100k genera $5k/año en renta = 5% cap rate.',
    },

    cashOnCash: {
        title: 'Cash-on-Cash Return',
        content: 'Tu ganancia anual como % del efectivo QUE TÚ pusiste (no el valor total). La mejor medida cuando usas créditos.',
        example: 'Tú pusiste $20k efectivo, ganas $2k/año = 10% cash-on-cash.',
    },

    // Análisis
    confidenceScore: {
        title: 'Confidence Score (Nivel de Confianza)',
        content: 'Qué tan segura está la IA de su análisis. Más alto = más confiable. Basado en la calidad y claridad del documento.',
        example: '80%+ = alta confianza. Bajo 50% = el documento era poco claro o incompleto.',
    },

    score: {
        title: 'Investment Score (Puntaje de Inversión)',
        content: 'La calificación de nuestro algoritmo sobre esta oportunidad de inversión. Considera ROI, riesgo, efectivo necesario y condiciones de mercado.',
        example: '70+ = strong buy (compra fuerte). 50-70 = decente. Bajo 50 = riesgoso o malos retornos.',
    },

    breakEven: {
        title: 'Break-Even Point (Punto de Equilibrio)',
        content: 'Cuándo las ganancias de tu inversión cubren todos tus costos. Después de este punto, estás haciendo ganancia pura.',
        example: 'Break-even en 3 años = recuperas tu dinero después de 3 años.',
    },

    // Archivos
    fileStatus: {
        title: 'File Status (Estado del Archivo)',
        content: 'Dónde está este archivo en nuestro pipeline de procesamiento. El análisis de IA ocurre automáticamente después del upload.',
        example: 'Pending = recién subido. Processing = IA está leyéndolo. Completed = análisis listo.',
    },

    // Campos de calculadora específicos
    askingPrice: {
        title: 'Asking Price (Precio de Venta)',
        content: 'El precio que pide el vendedor por el terreno. Este es el punto de partida para negociar.',
        example: 'Si el terreno está publicado en $50M CLP, ese es el asking price.',
    },

    appraisalValue: {
        title: 'Appraisal Value (Valor de Tasación)',
        content: 'El valor profesional estimado de una propiedad, determinado por un tasador. Puede ser diferente del precio de venta.',
        example: 'Si el banco lo tasa en $60M pero se vende en $50M, estás comprando bajo tasación.',
    },

    pricePerSquareMeter: {
        title: 'Price per m² (Precio por Metro Cuadrado)',
        content: 'El precio dividido por los metros cuadrados. Permite comparar terrenos de diferentes tamaños.',
        example: 'Terreno A: $50M / 1,000m² = $50,000/m². Terreno B: $80M / 2,000m² = $40,000/m². B tiene mejor precio por m².',
    },

    expectedAppreciation: {
        title: 'Expected Appreciation (Plusvalía Esperada)',
        content: 'Cuánto esperas que suba el valor del terreno por año, en porcentaje. Basado en tendencias del mercado y desarrollo de la zona.',
        example: 'Si una zona está creciendo rápido, podrías esperar 7-10% anual. Zona estable: 3-5%.',
    },

    // Gastos operacionales
    notaryFees: {
        title: 'Notary Fees (Gastos Notariales)',
        content: 'Costos de la escritura pública y firmas. En Chile, aproximadamente UF 2.5 (alrededor de $100k CLP).',
    },

    registrationFees: {
        title: 'Registration Fees (Inscripción CBR)',
        content: 'Costos para inscribir la propiedad en el Conservador de Bienes Raíces. Generalmente similar a los gastos notariales.',
    },

    appraisalFee: {
        title: 'Appraisal Fee (Tasación)',
        content: 'Costo de la tasación profesional que el banco requiere. Generalmente UF 2.5 o aproximadamente $100k CLP.',
    },

    insuranceFees: {
        title: 'Insurance Fees (Seguros)',
        content: 'Seguros requeridos por el banco: desgravamen (por si mueres) y/o incendio/sismo. Mensuales pero a veces hay costos upfront.',
    },

    stampTax: {
        title: 'Stamp Tax - Impuesto al Mutuo',
        content: 'Impuesto estampilla del 0.8% normalmente, o 0.2% con beneficio DFL2. Se paga sobre el monto del crédito.',
        example: 'En crédito de $100M: normal = $800k impuesto. Con DFL2 = $200k. Ahorro de $600k!',
    },

    // Métricas de análisis land+credit
    cashRequired: {
        title: 'Cash Required (Efectivo Requerido)',
        content: 'Todo el dinero en efectivo que necesitas para cerrar el trato: pie + gastos operacionales + diferencia si el crédito no cubre todo.',
        example: 'Pie $20M + Gastos $5M = $25M efectivo necesario.',
    },

    trueCost: {
        title: 'True Cost (Costo Real)',
        content: 'Cuánto pagarás en total durante la vida del préstamo: principal + intereses + seguros. Siempre es más del doble del préstamo!',
        example: 'Crédito de $100M a 20 años al 4%: pagas aproximadamente $145M en total.',
    },

    equityMultiple: {
        title: 'Equity Multiple',
        content: 'Cuántas veces recuperas tu dinero invertido al final. 2.0x = duplicaste tu plata. 1.5x = 50% ganancia total.',
        example: 'Inviertes $20k, recuperas $40k total = 2.0x equity multiple.',
    },

    paybackPeriod: {
        title: 'Payback Period (Período de Recuperación)',
        content: 'Cuántos años tarda tu inversión en devolverte todo el dinero que pusiste. Después de esto es pura ganancia.',
        example: 'Payback de 5 años = después del año 5, todo lo que ganes es ganancia neta.',
    },

    taxBenefit: {
        title: 'Tax Benefit (Beneficio Tributario)',
        content: 'Ahorro en impuestos que obtienes por tener una hipoteca. En Chile, puedes deducir el interés pagado de tu renta tributaria.',
        example: 'Si pagas $2M al año en intereses y tu tasa es 35%, ahorras $700k en impuestos.',
    },
}

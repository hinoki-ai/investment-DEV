import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  MapPin, 
  DollarSign,
  Filter,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Trees,
  Grid3X3,
  List
} from 'lucide-react'
import { investmentsApi } from '../lib/api'
import { formatCurrency } from '../lib/utils'

const categories = [
  { value: '', label: 'Todas las Categorías' },
  { value: 'land', label: '🏞️ Terrenos' },
  { value: 'stocks', label: '📈 Acciones' },
  { value: 'gold', label: '🪙 Oro' },
  { value: 'crypto', label: '₿ Crypto' },
  { value: 'real_estate', label: '🏢 Inmuebles' },
  { value: 'bonds', label: '📜 Bonos' },
  { value: 'other', label: '📦 Otros' },
]

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { 
    label: 'Activo', 
    className: 'bg-success-dim text-success border-success/20' 
  },
  sold: { 
    label: 'Vendido', 
    className: 'bg-surface text-text-muted border-border' 
  },
  pending: { 
    label: 'Pendiente', 
    className: 'bg-warning-dim text-warning border-warning/20' 
  },
  under_contract: { 
    label: 'En Contrato', 
    className: 'bg-info-dim text-info border-info/20' 
  },
}

const categoryIcons: Record<string, string> = {
  land: '🏞️',
  stocks: '📈',
  gold: '🪙',
  crypto: '₿',
  real_estate: '🏢',
  bonds: '📜',
  other: '📦'
}

export default function Investments() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const { data: investments, isLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: () => investmentsApi.list(),
  })

  // Ensure investments is an array - API might return non-array on error
  const investmentsArray = Array.isArray(investments) ? investments : []
  
  const filteredInvestments = investmentsArray.filter((inv: any) => {
    const matchesSearch = inv.name?.toLowerCase().includes(search.toLowerCase()) ||
                         inv.city?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !category || inv.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Trees className="h-4 w-4 text-cream-muted" />
            <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Portafolio</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Inversiones</h1>
          <p className="text-text-secondary mt-1">
            Gestiona y monitorea tus activos de inversión
          </p>
        </div>
        <Link 
          to="/investments/new" 
          className="glyph-btn glyph-btn-primary"
        >
          <Plus className="h-4 w-4" />
          Agregar Inversión
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar inversiones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-11"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-muted" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field py-2.5 pr-10"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center bg-surface rounded-lg p-1 border border-border">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-cream/10 text-cream' : 'text-text-muted hover:text-text-primary'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-cream/10 text-cream' : 'text-text-muted hover:text-text-primary'}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          {filteredInvestments?.length || 0} inversión{filteredInvestments?.length !== 1 ? 'es' : ''}
        </span>
        {(search || category) && (
          <button 
            onClick={() => { setSearch(''); setCategory('') }}
            className="text-cream-muted hover:text-cream transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Investment List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 sm:h-28 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredInvestments?.length ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
          {filteredInvestments.map((investment: any) => (
            <Link
              key={investment.id}
              to={`/investments/${investment.id}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-5 transition-all duration-300 hover:border-border-strong hover:-translate-y-0.5 card-hover"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-cream/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-lg">{categoryIcons[investment.category] || '📦'}</span>
                      <h3 className="text-sm sm:text-base font-semibold text-text-primary group-hover:text-cream transition-colors truncate">
                        {investment.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-medium tracking-wider uppercase px-2 py-1 rounded-full border ${
                        statusConfig[investment.status]?.className || statusConfig.active.className
                      }`}>
                        {statusConfig[investment.status]?.label || investment.status}
                      </span>
                      
                      {investment.city && (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[100px] sm:max-w-none">{investment.city}</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4 mt-3 text-xs text-text-muted">
                      {investment.land_area_hectares && (
                        <span className="font-mono">{investment.land_area_hectares} ha</span>
                      )}
                      {investment.document_count !== undefined && (
                        <span>{investment.document_count} docs</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-mono text-base sm:text-lg font-semibold text-cream">
                        {investment.current_value 
                          ? formatCurrency(investment.current_value)
                          : '—'
                        }
                      </p>
                      {investment.return_percentage !== undefined && (
                        <p className={`text-xs font-mono flex items-center justify-end gap-1 ${
                          investment.return_percentage >= 0 
                            ? 'text-success' 
                            : 'text-error'
                        }`}>
                          {investment.return_percentage >= 0 
                            ? <ArrowUpRight className="h-3 w-3" />
                            : <ArrowDownRight className="h-3 w-3" />
                          }
                          {Math.abs(investment.return_percentage).toFixed(1)}%
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-muted group-hover:text-cream transition-colors flex-shrink-0" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface flex items-center justify-center">
            <DollarSign className="h-8 w-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-1">
            {search || category ? 'No se encontraron coincidencias' : 'Aún no hay inversiones'}
          </h3>
          <p className="text-sm text-text-muted mb-6">
            {search || category 
              ? 'Intenta ajustar tu búsqueda o filtros'
              : 'Comienza agregando tu primera inversión'
            }
          </p>
          {!(search || category) && (
            <Link to="/investments/new" className="glyph-btn glyph-btn-primary">
              <Plus className="h-4 w-4" />
              Agregar Inversión
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

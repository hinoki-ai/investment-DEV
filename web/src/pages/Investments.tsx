import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  MapPin, 
  DollarSign,
  Filter,
  ChevronRight
} from 'lucide-react'
import { investmentsApi } from '../lib/api'
import { formatCurrency, categoryColors, categoryLabels } from '../lib/utils'

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'land', label: 'Land' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'gold', label: 'Gold' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'bonds', label: 'Bonds' },
  { value: 'other', label: 'Other' },
]

export default function Investments() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const { data: investments, isLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: () => investmentsApi.list(),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investments</h1>
          <p className="text-gray-600 mt-1">
            Manage your investment portfolio
          </p>
        </div>
        <Link to="/investments/new" className="btn-primary flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />
          Add Investment
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search investments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input w-full sm:w-48"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Investment List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : investments?.length ? (
        <div className="space-y-4">
          {investments.map((investment) => (
            <Link
              key={investment.id}
              to={`/investments/${investment.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {investment.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[investment.category]}`}>
                      {categoryLabels[investment.category]}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      investment.status === 'active' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {investment.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    {investment.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {investment.city}, {investment.state}
                      </span>
                    )}
                    {investment.land_area_hectares && (
                      <span>{investment.land_area_hectares} ha</span>
                    )}
                    {investment.document_count !== undefined && (
                      <span>{investment.document_count} documents</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {investment.current_value 
                        ? formatCurrency(investment.current_value)
                        : '—'
                      }
                    </p>
                    {investment.return_percentage !== undefined && (
                      <p className={`text-sm ${
                        investment.return_percentage >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {investment.return_percentage >= 0 ? '+' : ''}
                        {investment.return_percentage.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No investments found</h3>
          <p className="text-gray-600 mt-1">
            Get started by adding your first investment
          </p>
          <Link to="/investments/new" className="btn-primary inline-flex items-center gap-2 mt-4">
            <Plus className="h-4 w-4" />
            Add Investment
          </Link>
        </div>
      )}
    </div>
  )
}

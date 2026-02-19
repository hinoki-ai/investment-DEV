import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  MapPin, 
  Upload,
  Trash2,
  Edit
} from 'lucide-react'
import { investmentsApi, uploadsApi } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'

export default function InvestmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isUploading, setIsUploading] = useState(false)

  const { data: investment, isLoading } = useQuery({
    queryKey: ['investment', id],
    queryFn: () => investmentsApi.get(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => investmentsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      navigate('/investments')
    },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return

    setIsUploading(true)
    try {
      // 1. Request upload URL
      const { upload_url, file_id } = await uploadsApi.requestUrl({
        filename: file.name,
        content_type: file.type,
        investment_id: id,
        source_device: 'web',
      })

      // 2. Upload file directly to storage
      const response = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!response.ok) throw new Error('Upload failed')

      // 3. Confirm upload and queue analysis
      await uploadsApi.confirm({
        file_id,
        investment_id: id,
        document_type: 'other',
        request_analysis: true,
      })

      queryClient.invalidateQueries({ queryKey: ['investment', id] })
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="card h-64 bg-gray-100 animate-pulse" />
      </div>
    )
  }

  if (!investment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Investment not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/investments')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{investment.name}</h1>
            <span className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded-full capitalize">
              {investment.category}
            </span>
          </div>
          {investment.city && (
            <p className="text-gray-600 flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {investment.city}, {investment.state}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to delete this investment?')) {
                deleteMutation.mutate()
              }
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Overview */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Purchase Price</p>
                <p className="text-xl font-semibold text-gray-900">
                  {investment.purchase_price 
                    ? formatCurrency(investment.purchase_price)
                    : '—'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Value</p>
                <p className="text-xl font-semibold text-gray-900">
                  {investment.current_value 
                    ? formatCurrency(investment.current_value)
                    : '—'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Return</p>
                <p className={`text-xl font-semibold ${
                  (investment.return_percentage || 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {investment.return_percentage !== undefined
                    ? `${investment.return_percentage >= 0 ? '+' : ''}${investment.return_percentage.toFixed(1)}%`
                    : '—'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Documents</p>
                <p className="text-xl font-semibold text-gray-900">
                  {investment.document_count || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {investment.description && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600">{investment.description}</p>
            </div>
          )}

          {/* Land Specific */}
          {investment.category === 'land' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Land Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Area</p>
                  <p className="text-lg font-medium text-gray-900">
                    {investment.land_area_hectares 
                      ? `${investment.land_area_hectares} ha`
                      : '—'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Zoning</p>
                  <p className="text-lg font-medium text-gray-900 capitalize">
                    {investment.zoning_type || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ownership</p>
                  <p className="text-lg font-medium text-gray-900">
                    {investment.ownership_percentage}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upload Card */}
          <div className="card bg-primary-50 border-primary-200">
            <h3 className="font-semibold text-primary-900 mb-2">Upload Documents</h3>
            <p className="text-sm text-primary-700 mb-4">
              Upload deeds, contracts, photos, or any related files
            </p>
            <label className="btn-primary w-full flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Choose File'}
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          {/* Key Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Key Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="capitalize">{investment.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Purchase Date</span>
                <span>{investment.purchase_date ? formatDate(investment.purchase_date) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span>{formatDate(investment.updated_at)}</span>
              </div>
              {investment.tags?.length > 0 && (
                <div className="pt-2 border-t">
                  <span className="text-gray-600 block mb-2">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {investment.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

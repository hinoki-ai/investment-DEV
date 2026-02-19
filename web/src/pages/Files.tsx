import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  FileText, 
  Search, 
  Download,
  Filter,
  Image,
  FileVideo,
  FileAudio,
  File,
  FolderOpen,
  HardDrive
} from 'lucide-react'
import { filesApi } from '../lib/api'
import { formatDate, formatFileSize } from '../lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { 
    label: 'Pending', 
    className: 'bg-warning-dim text-warning border-warning/20' 
  },
  processing: { 
    label: 'Processing', 
    className: 'bg-info-dim text-info border-info/20' 
  },
  completed: { 
    label: 'Completed', 
    className: 'bg-success-dim text-success border-success/20' 
  },
  failed: { 
    label: 'Failed', 
    className: 'bg-error-dim text-error border-error/20' 
  },
}

const getFileIcon = (mimeType?: string) => {
  if (mimeType?.startsWith('image/')) return Image
  if (mimeType?.startsWith('video/')) return FileVideo
  if (mimeType?.startsWith('audio/')) return FileAudio
  return File
}

const getFileIconColor = (mimeType?: string) => {
  if (mimeType?.startsWith('image/')) return 'text-purple-400 bg-purple-400/10'
  if (mimeType?.startsWith('video/')) return 'text-rose-400 bg-rose-400/10'
  if (mimeType?.startsWith('audio/')) return 'text-amber-400 bg-amber-400/10'
  if (mimeType?.startsWith('application/pdf')) return 'text-red-400 bg-red-400/10'
  return 'text-cream-muted bg-surface-elevated'
}

export default function Files() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data: files, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => filesApi.list(),
  })

  const handleDownload = async (fileId: string, _filename: string) => {
    try {
      const { download_url } = await filesApi.getDownloadUrl(fileId)
      window.open(download_url, '_blank')
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to generate download link')
    }
  }

  const filteredFiles = files?.filter((f: any) => {
    const matchesSearch = f.original_filename.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !status || f.status === status
    return matchesSearch && matchesStatus
  })

  const totalSize = files?.reduce((acc: number, f: any) => acc + (f.file_size_bytes || 0), 0)

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-4 w-4 text-cream-muted" />
            <span className="text-xs font-semibold tracking-widest text-cream-muted uppercase">Storage</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Files</h1>
          <p className="text-text-secondary mt-1">
            Browse and manage uploaded documents
          </p>
        </div>
        
        {totalSize > 0 && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <HardDrive className="h-4 w-4" />
            <span className="font-mono">{formatFileSize(totalSize)}</span>
            <span>total</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-11"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field py-2.5 pr-10"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          {filteredFiles?.length || 0} file{filteredFiles?.length !== 1 ? 's' : ''}
        </span>
        {(search || status) && (
          <button 
            onClick={() => { setSearch(''); setStatus('') }}
            className="text-cream-muted hover:text-cream transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* File List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredFiles?.length ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-[10px] font-semibold tracking-widest text-text-muted uppercase">
                    File
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold tracking-widest text-text-muted uppercase">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold tracking-widest text-text-muted uppercase">
                    Uploaded
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-semibold tracking-widest text-text-muted uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold tracking-widest text-text-muted uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredFiles.map((file: any) => {
                  const Icon = getFileIcon(file.mime_type)
                  const iconColorClass = getFileIconColor(file.mime_type)
                  return (
                    <tr key={file.id} className="group hover:bg-surface-elevated/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-xl ${iconColorClass}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-text-primary truncate max-w-[200px] sm:max-w-xs">
                              {file.original_filename}
                            </div>
                            <div className="text-xs text-text-muted">
                              {file.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-text-secondary">
                          {file.file_size_bytes ? formatFileSize(file.file_size_bytes) : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-text-secondary">
                          {formatDate(file.uploaded_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full border ${
                          statusConfig[file.status]?.className || statusConfig.pending.className
                        }`}>
                          {statusConfig[file.status]?.label || file.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDownload(file.id, file.original_filename)}
                          className="p-2 rounded-lg text-text-muted hover:text-cream hover:bg-cream/10 transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface flex items-center justify-center">
            <FileText className="h-8 w-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-1">
            {search || status ? 'No matches found' : 'No files yet'}
          </h3>
          <p className="text-sm text-text-muted">
            {search || status 
              ? 'Try adjusting your search or filters'
              : 'Upload files from the investments page'
            }
          </p>
        </div>
      )}
    </div>
  )
}

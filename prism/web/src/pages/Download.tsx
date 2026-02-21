import { useState, useEffect } from 'react'
import {
  Smartphone,
  Download,
  CheckCircle2,
  Shield,
  ArrowRight,
  FileArchive,
  Calendar,
  Info
} from 'lucide-react'

interface APKInfo {
  version: string
  size: string
  filename: string
  updated: string
}

export default function DownloadPage() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [apkInfo, setApkInfo] = useState<APKInfo>({
    version: '1.0.2',
    size: '10.4 MB',
    filename: 'nexus-latest-release.apk',
    updated: new Date().toLocaleDateString('es-CL')
  })

  // Check for APK file on mount
  useEffect(() => {
    // Try to get APK info from HEAD request
    fetch('/releases/nexus-latest-release.apk', { method: 'HEAD' })
      .then(response => {
        const contentLength = response.headers.get('content-length')
        if (contentLength) {
          const sizeMB = (parseInt(contentLength) / 1024 / 1024).toFixed(1)
          setApkInfo(prev => ({ ...prev, size: `${sizeMB} MB` }))
        }
      })
      .catch(() => {
        // Use default values if request fails
      })
  }, [])

  const handleDownload = () => {
    setIsDownloading(true)
    setShowToast(true)

    // Create download link
    const link = document.createElement('a')
    link.href = `/releases/${apkInfo.filename}`
    link.download = apkInfo.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Reset states after animation
    setTimeout(() => {
      setIsDownloading(false)
    }, 2000)

    setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }

  const installationSteps = [
    'Haz tap en el botón de Download APK de abajo',
    'Wait a que se complete el download',
    'Abre el downloaded file desde las notificaciones',
    'Si te sale un prompt, allow "Install from unknown sources"',
    'Haz tap en "Install" y espera a que termine',
    'Abre NEXUS y configura tus API settings'
  ]

  const features = [
    {
      icon: Smartphone,
      title: 'Direct Upload',
      description: 'Sube tus files directamente al cloud storage con pre-signed URLs'
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'Tus files nunca pasan por intermediate servers'
    },
    {
      icon: CheckCircle2,
      title: 'Auto Analysis',
      description: 'Opcionalmente puedes poner los files en queue para AI processing automáticamente'
    }
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-surface border border-border mb-6">
          <Smartphone className="w-10 h-10 text-cream" />
        </div>
        <h1 className="text-3xl font-semibold text-text-primary mb-2">
          NEXUS Mobile
        </h1>
        <p className="text-text-secondary">
          Family Investment Tracker para Android
        </p>
      </div>

      {/* Download Card */}
      <div className="bg-surface border border-border rounded-2xl p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream/10 text-cream text-xs font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Version {apkInfo.version}
            </span>
          </div>
          <div className="text-right text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <FileArchive className="w-4 h-4" />
              {apkInfo.size}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              {apkInfo.updated}
            </div>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${isDownloading
              ? 'bg-success/20 text-success cursor-wait'
              : 'bg-cream text-void hover:bg-cream-light'
            }`}
        >
          {isDownloading ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Descargando...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Descargar APK</span>
            </>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-text-muted">
          Android 8.0+ requerido • APK firmado • Updateado: {apkInfo.updated}
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-4 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-surface/50 border border-border rounded-xl"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cream/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-cream" />
              </div>
              <div>
                <h3 className="font-medium text-text-primary">{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Installation Steps */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-cream uppercase tracking-wider mb-4 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Pasos de Instalación
        </h2>
        <ol className="space-y-3">
          {installationSteps.map((step, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-sm text-text-secondary"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-xs font-medium text-cream">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Share Link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-text-muted mb-2">Compartir descarga:</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface/50 border border-border rounded-lg">
          <code className="text-xs text-cream font-mono">
            https://inv.aramac.dev/download
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText('https://inv.aramac.dev/download')
              setShowToast(true)
              setTimeout(() => setShowToast(false), 2000)
            }}
            className="p-1.5 text-text-muted hover:text-cream transition-colors"
            title="Copiar enlace"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 bg-surface-elevated border border-success/30 rounded-xl shadow-xl transition-all duration-300 ${showToast
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
      >
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isDownloading ? 'Descarga iniciada' : 'Enlace copiado'}
          </span>
        </div>
      </div>
    </div>
  )
}

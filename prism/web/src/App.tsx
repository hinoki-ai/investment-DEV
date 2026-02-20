import { lazy, Suspense, Component, type ReactNode, type ErrorInfo } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

// Eager load critical pages
import Dashboard from './pages/Dashboard'
import Investments from './pages/Investments'
import InvestmentDetail from './pages/InvestmentDetail'
import Files from './pages/Files'

// LandAnalyzer is complex with nested routes - keep eagerly loaded for now
// Can be optimized later with proper code splitting
import LandAnalyzer, {
  OverviewView,
  AnalysisView,
  CompareView,
  LandsView,
  CreditsView,
  CalculatorView
} from './pages/LandAnalyzer'

// Lazy load heavy pages (these are good candidates for code splitting)
const Analysis = lazy(() => import('./pages/Analysis'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Chat = lazy(() => import('./pages/Chat'))
const Download = lazy(() => import('./pages/Download'))

// Page loader component for lazy-loaded routes
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-border rounded-full" />
        <div className="absolute inset-0 w-12 h-12 border-2 border-cream border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="mt-4 text-sm text-text-secondary">Loading...</p>
    </div>
  )
}

// ─── Error Boundary ──────────────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-void flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-lg font-semibold text-text-primary">Algo salió mal</h1>
            <p className="text-sm text-text-secondary">
              Ocurrió un error inesperado. Por favor recarga la página.
            </p>
            {this.state.error && (
              <details className="text-left text-xs text-text-muted bg-void rounded-lg p-3">
                <summary className="cursor-pointer font-medium mb-1">Detalles técnicos</summary>
                <code className="whitespace-pre-wrap break-all">{this.state.error.message}</code>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="glyph-btn glyph-btn-primary mx-auto"
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          {/* Critical paths - eager loaded for fast initial render */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/investments/:id" element={<InvestmentDetail />} />
          <Route path="/files" element={<Files />} />

          {/* Lazy loaded paths - these are heavier/less frequently accessed */}
          <Route
            path="/analysis"
            element={
              <Suspense fallback={<PageLoader />}>
                <Analysis />
              </Suspense>
            }
          />

          <Route
            path="/analytics"
            element={
              <Suspense fallback={<PageLoader />}>
                <Analytics />
              </Suspense>
            }
          />

          {/* Land Analyzer with nested routes - eagerly loaded due to complex structure */}
          <Route path="/land-analyzer" element={<LandAnalyzer />}>
            <Route index element={<OverviewView />} />
            <Route path="overview" element={<OverviewView />} />
            <Route path="analysis" element={<AnalysisView />} />
            <Route path="compare" element={<CompareView />} />
            <Route path="lands" element={<LandsView />} />
            <Route path="credits" element={<CreditsView />} />
            <Route path="calculator" element={<CalculatorView />} />
          </Route>

          <Route
            path="/chat"
            element={
              <Suspense fallback={<PageLoader />}>
                <Chat />
              </Suspense>
            }
          />

          <Route
            path="/download"
            element={
              <Suspense fallback={<PageLoader />}>
                <Download />
              </Suspense>
            }
          />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}

export default App

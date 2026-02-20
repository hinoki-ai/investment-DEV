import { lazy, Suspense } from 'react'
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

function App() {
  return (
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
  )
}

export default App

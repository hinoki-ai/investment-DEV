import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Trees, 
  FileText, 
  Brain,
  Upload,
  Menu,
  X,
  Calculator,
  ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/investments', label: 'Investments', icon: Trees },
  { path: '/land-analyzer', label: 'Analyzer', icon: Calculator },
  { path: '/files', label: 'Files', icon: FileText },
  { path: '/analysis', label: 'Analysis', icon: Brain },
]

// Glyph dot pattern component
function GlyphPattern({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 opacity-30 pointer-events-none ${className}`}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="glyph-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" className="text-cream/20" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#glyph-dots)" />
      </svg>
    </div>
  )
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Track scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-void text-text-primary font-sans">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[80%] h-[80%] bg-cream/[0.02] rounded-full blur-[120px]" />
        <div className="absolute -bottom-[40%] -left-[20%] w-[60%] h-[60%] bg-cream/[0.01] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-void/80 backdrop-blur-xl border-b border-border' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <div className="absolute inset-0 bg-cream/10 rounded-xl border border-cream/20 group-hover:border-cream/40 transition-colors" />
                <GlyphPattern className="rounded-xl opacity-50" />
                <img 
                  src="/favinv.png" 
                  alt="FavInv" 
                  className="relative w-5 h-5 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-semibold tracking-wide text-text-primary">FAMINV</span>
                <span className="block text-[10px] tracking-widest text-text-muted uppercase">Investments</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg flex items-center gap-2 ${
                      isActive 
                        ? 'text-cream bg-surface' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-0 rounded-lg bg-cream/5" />
                    )}
                    <span className="relative flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                to="/investments"
                className="glyph-btn glyph-btn-primary text-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Upload</span>
              </Link>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          className="absolute inset-0 bg-void/95 backdrop-blur-xl"
          onClick={() => setMobileMenuOpen(false)}
        />
        <nav className={`absolute top-16 left-0 right-0 p-4 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-y-0' : '-translate-y-4'
        }`}>
          <div className="glass-card-elevated p-2 space-y-1">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path))
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-cream/10 text-cream' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'text-cream' : 'text-text-muted'}`} />
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center opacity-50">
                <img src="/favinv.png" alt="" className="w-4 h-4 object-contain" />
              </div>
              <span className="text-xs text-text-muted">Family Investment Dashboard</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                System Online
              </span>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

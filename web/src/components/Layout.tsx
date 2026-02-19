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

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-cream/10 rounded-xl border border-cream/20 group-hover:border-cream/40 transition-colors" />
            <img 
              src="/favinv.png" 
              alt="FavInv" 
              className="relative w-5 h-5 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-wide text-text-primary">FAMINV</span>
            <span className="block text-[10px] tracking-widest text-text-muted uppercase">Investments</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path))
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-surface text-cream' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
              }`}
            >
              <div className={`relative ${isActive ? 'text-cream' : 'text-text-muted group-hover:text-text-primary'}`}>
                <Icon className="h-5 w-5" />
                {isActive && (
                  <span className="absolute -inset-1 bg-cream/10 rounded-full blur-sm" />
                )}
              </div>
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <ChevronRight className="h-4 w-4 ml-auto text-cream/60" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 space-y-3">
        <div className="h-px bg-border mx-2" />
        
        {/* Upload Button */}
        <Link
          to="/investments"
          className="glyph-btn glyph-btn-primary w-full justify-center"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Document</span>
        </Link>

        {/* Footer Info */}
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center opacity-50">
              <img src="/favinv.png" alt="" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-xs text-text-muted">Nest</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Online
          </div>
        </div>
        <div className="text-[10px] text-text-muted px-2">v1.0.0</div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-void text-text-primary font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col border-r border-border bg-void-deep/50 backdrop-blur-xl z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-void/95 border-b border-border backdrop-blur-xl">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-cream/10 rounded-xl border border-cream/20" />
              <img 
                src="/favinv.png" 
                alt="FavInv" 
                className="relative w-5 h-5 object-contain"
              />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-wide">FAMINV</span>
            </div>
          </Link>

          {/* Menu Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-void/90 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        
        {/* Mobile Sidebar Panel */}
        <aside 
          className={`absolute left-0 top-16 bottom-0 w-72 bg-void-deep border-r border-border flex flex-col transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-surface text-cream' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-cream' : ''}`} />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 ml-auto text-cream/60" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          {/* Mobile Bottom Actions */}
          <div className="p-4 border-t border-border space-y-3">
            <Link
              to="/investments"
              className="glyph-btn glyph-btn-primary w-full justify-center"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Document</span>
            </Link>
            <div className="flex items-center justify-between text-xs text-text-muted px-2">
              <span>v1.0.0</span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                System Online
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="pt-20 lg:pt-8 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

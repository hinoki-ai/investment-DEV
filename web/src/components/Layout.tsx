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
  ChevronRight,
  PanelLeft
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved) setSidebarCollapsed(saved === 'true')
  }, [])

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', String(newState))
  }

  const isExpanded = !sidebarCollapsed || isHovered

  return (
    <div className="min-h-screen bg-void text-text-primary font-sans">
      
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex fixed left-0 top-0 h-full flex-col border-r border-border bg-void-deep/80 backdrop-blur-xl z-40 transition-all duration-300 ease-out ${
          isExpanded ? 'w-64' : 'w-16'
        }`}
        onMouseEnter={() => sidebarCollapsed && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo Section */}
        <div className={`p-4 transition-all duration-300 ${isExpanded ? '' : 'px-3'}`}>
          <Link to="/" className={`flex items-center gap-3 group ${isExpanded ? '' : 'justify-center'}`}>
            <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
              <div className="absolute inset-0 bg-cream/10 rounded-xl border border-cream/20 group-hover:border-cream/40 transition-colors" />
              <img 
                src="/favinv.png" 
                alt="FavInv" 
                className="relative w-5 h-5 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
              <span className="text-sm font-semibold tracking-wide text-text-primary whitespace-nowrap">FAMINV</span>
              <span className="block text-[10px] tracking-widest text-text-muted uppercase whitespace-nowrap">Investments</span>
            </div>
          </Link>
        </div>

        {/* Toggle Button */}
        <div className={`px-4 mb-2 transition-all duration-300 ${isExpanded ? '' : 'px-2'}`}>
          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-2 text-text-muted hover:text-text-primary transition-all duration-200 ${
              isExpanded ? 'w-full px-3 py-2 rounded-lg hover:bg-surface/50' : 'w-full justify-center p-2 rounded-lg hover:bg-surface/50'
            }`}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className={`h-4 w-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            <span className={`text-xs font-medium overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
              {sidebarCollapsed ? 'Expand' : 'Collapse'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-1 transition-all duration-300 ${isExpanded ? 'px-3' : 'px-2'}`}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path))
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-surface text-cream' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                } ${isExpanded ? 'px-4 py-3' : 'p-3 justify-center'}`}
                title={!isExpanded ? item.label : undefined}
              >
                <div className={`relative ${isActive ? 'text-cream' : 'text-text-muted group-hover:text-text-primary'}`}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isActive && (
                    <span className="absolute -inset-1 bg-cream/10 rounded-full blur-sm" />
                  )}
                </div>
                <span className={`font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                  {item.label}
                </span>
                {isActive && isExpanded && (
                  <ChevronRight className="h-4 w-4 ml-auto text-cream/60 flex-shrink-0" />
                )}
                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-surface-elevated border-l border-b border-border rotate-45" />
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className={`p-4 space-y-3 transition-all duration-300 ${isExpanded ? '' : 'px-2'}`}>
          <div className={`h-px bg-border transition-all duration-300 ${isExpanded ? 'mx-2' : 'mx-0'}`} />
          
          {/* Upload Button */}
          <Link
            to="/investments"
            className={`glyph-btn glyph-btn-primary transition-all duration-300 ${
              isExpanded ? 'w-full justify-center' : 'w-full p-3 justify-center'
            }`}
            title={!isExpanded ? "Upload Document" : undefined}
          >
            <Upload className="h-4 w-4 flex-shrink-0" />
            <span className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
              Upload Document
            </span>
          </Link>

          {/* Footer Info */}
          <div className={`flex items-center justify-between pt-2 transition-all duration-300 ${isExpanded ? 'px-2' : 'flex-col gap-2'}`}>
            <div className={`flex items-center gap-2 ${isExpanded ? '' : 'justify-center'}`}>
              <div className="w-6 h-6 flex items-center justify-center opacity-50">
                <img src="/favinv.png" alt="" className="w-4 h-4 object-contain" />
              </div>
              <span className={`text-xs text-text-muted overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                Nest
              </span>
            </div>
            <div className={`flex items-center gap-2 text-xs text-text-muted ${isExpanded ? '' : 'flex-col'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse flex-shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                Online
              </span>
            </div>
          </div>
          <div className={`text-[10px] text-text-muted overflow-hidden transition-all duration-300 ${isExpanded ? 'px-2 w-auto opacity-100' : 'w-0 h-0 opacity-0'}`}>
            v1.0.0
          </div>
        </div>
      </aside>

      {/* Desktop Header (when sidebar collapsed) */}
      <header className="hidden lg:flex fixed top-0 left-16 right-0 h-16 items-center justify-between px-6 z-30 bg-void/50 backdrop-blur-sm">
        <h1 className="text-lg font-semibold text-text-primary">
          {navItems.find(item => item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path)))?.label || 'Overview'}
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-xs text-text-muted">{new Date().toLocaleDateString()}</span>
        </div>
      </header>

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
      <main className={`transition-all duration-300 min-h-screen ${
        isExpanded ? 'lg:ml-64' : 'lg:ml-16'
      }`}>
        <div className="pt-20 lg:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

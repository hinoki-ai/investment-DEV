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
  PanelLeft,
  ChevronDown,
  Download,
  FolderOpen,
  Bot,
  type LucideIcon
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import MarketDataTicker from './MarketDataTicker'

interface LayoutProps {
  children: React.ReactNode
}

// Types for navigation structure
interface NavItemBase {
  label: string
  icon: LucideIcon
  badge?: string
  badgeColor?: 'neutral' | 'cream' | 'success' | 'warning'
}

interface NavItem extends NavItemBase {
  path: string
}

interface NavSection {
  type: 'section'
  label: string
}

interface NavGroup {
  type: 'group'
  label: string
  icon: LucideIcon
  items: NavItem[]
  defaultExpanded?: boolean
}

type NavElement = NavItem | NavSection | NavGroup

// Type guards
const isNavSection = (el: NavElement): el is NavSection => {
  return 'type' in el && el.type === 'section'
}

const isNavGroup = (el: NavElement): el is NavGroup => {
  return 'type' in el && el.type === 'group'
}

const isNavItem = (el: NavElement): el is NavItem => {
  return !('type' in el) && 'path' in el
}

// Navigation structure with nested categories
const navigation: NavElement[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  
  { type: 'section', label: 'Portafolio' },
  {
    type: 'group',
    label: 'Inversiones',
    icon: Trees,
    defaultExpanded: true,
    items: [
      { path: '/investments', label: 'Todas', icon: FolderOpen },
      { path: '/land-analyzer', label: 'Land Analyzer', icon: Calculator, badge: 'AI', badgeColor: 'cream' },
    ]
  },
  
  { type: 'section', label: 'Inteligencia' },
  { path: '/chat', label: 'NEXUS Chat', icon: Bot, badge: 'AI', badgeColor: 'cream' },
  
  { type: 'section', label: 'Documentos' },
  {
    type: 'group',
    label: 'Archivos y Análisis',
    icon: FileText,
    items: [
      { path: '/files', label: 'Todos los Archivos', icon: FolderOpen },
      { path: '/analysis', label: 'Análisis', icon: Brain },
    ]
  },
]

// Check if a group contains the active path
const isGroupActive = (group: NavGroup, pathname: string): boolean => {
  return group.items.some(item => {
    return pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
  })
}

// Check if an item is active
const isItemActive = (item: { path: string }, pathname: string): boolean => {
  return pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  // Hover state removed - only manual toggle
  
  // Track expanded groups - initialize based on active state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    navigation.forEach(el => {
      if (isNavGroup(el)) {
        if (el.defaultExpanded || isGroupActive(el, location.pathname)) {
          initial.add(el.label)
        }
      }
    })
    return initial
  })

  // Update expanded groups when path changes (for initial load)
  useEffect(() => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      navigation.forEach(el => {
        if (isNavGroup(el) && isGroupActive(el, location.pathname)) {
          next.add(el.label)
        }
      })
      return next
    })
  }, [location.pathname])

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

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }, [])

  const isExpanded = !sidebarCollapsed

  // Badge component
  const Badge = ({ text, color }: { text: string, color?: string }) => {
    const colorClasses = {
      neutral: 'bg-surface text-text-secondary border-border',
      cream: 'bg-cream/10 text-cream border-cream/20',
      success: 'bg-success/10 text-success border-success/20',
      warning: 'bg-warning/10 text-warning border-warning/20',
    }[color || 'neutral']
    
    return (
      <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClasses}`}>
        {text}
      </span>
    )
  }

  // Render navigation element
  const renderNavElement = (el: NavElement, index: number) => {
    // Section header
    if (isNavSection(el)) {
      return (
        <div 
          key={`section-${index}`}
          className={`mt-6 mb-2 px-4 text-[10px] font-semibold tracking-widest text-text-muted uppercase transition-all duration-300 ${
            isExpanded ? 'opacity-100' : 'opacity-0 h-0 mt-0 mb-0 overflow-hidden'
          }`}
        >
          {el.label}
        </div>
      )
    }

    // Group with nested items
    if (isNavGroup(el)) {
      const GroupIcon = el.icon
      const isActive = isGroupActive(el, location.pathname)
      const isGroupExpanded = expandedGroups.has(el.label)
      
      return (
        <div key={`group-${index}`} className="mb-1">
          {/* Group Header Button */}
          <button
            onClick={() => toggleGroup(el.label)}
            className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 group ${
              isActive 
                ? 'text-cream bg-surface/80' 
                : 'text-text-secondary hover:text-text-primary hover:bg-surface/40'
            } ${isExpanded ? 'px-4 py-2.5' : 'p-3 justify-center'}`}
            title={!isExpanded ? el.label : undefined}
          >
            <div className={`relative ${isActive ? 'text-cream' : 'text-text-muted group-hover:text-text-primary'}`}>
              <GroupIcon className="h-5 w-5 flex-shrink-0" />
              {isActive && (
                <span className="absolute -inset-1 bg-cream/10 rounded-full blur-sm" />
              )}
            </div>
            
            <span className={`font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${
              isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
            }`}>
              {el.label}
            </span>
            
            {isExpanded && (
              <ChevronDown 
                className={`h-4 w-4 ml-auto text-text-muted transition-transform duration-300 ${
                  isGroupExpanded ? 'rotate-180' : ''
                }`} 
              />
            )}
            
            {/* Tooltip for collapsed state */}
            {!isExpanded && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
                {el.label}
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-surface-elevated border-l border-b border-border rotate-45" />
              </div>
            )}
          </button>
          
          {/* Nested Items */}
          <div className={`overflow-hidden transition-all duration-300 ease-out ${
            isExpanded && isGroupExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="mt-1 ml-4 pl-4 border-l border-border space-y-0.5">
              {el.items.map((item, itemIndex) => {
                const ItemIcon = item.icon
                const itemActive = isItemActive(item, location.pathname)
                
                return (
                  <Link
                    key={`${el.label}-item-${itemIndex}`}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group/item ${
                      itemActive 
                        ? 'text-cream bg-surface' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/30'
                    }`}
                  >
                    <ItemIcon className={`h-4 w-4 flex-shrink-0 ${itemActive ? 'text-cream' : 'text-text-muted group-hover/item:text-text-primary'}`} />
                    <span className="text-sm font-medium whitespace-nowrap flex-1">{item.label}</span>
                    {item.badge && <Badge text={item.badge} color={item.badgeColor} />}
                    {itemActive && (
                      <ChevronRight className="h-3 w-3 text-cream/60 flex-shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    // Regular nav item (flat)
    if (isNavItem(el)) {
      const Icon = el.icon
      const active = isItemActive(el, location.pathname)
      
      return (
        <Link
          key={`item-${index}`}
          to={el.path}
          className={`flex items-center gap-3 rounded-xl transition-all duration-200 group relative mb-1 ${
            active 
              ? 'bg-surface text-cream' 
              : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
          } ${isExpanded ? 'px-4 py-3' : 'p-3 justify-center'}`}
          title={!isExpanded ? el.label : undefined}
        >
          <div className={`relative ${active ? 'text-cream' : 'text-text-muted group-hover:text-text-primary'}`}>
            <Icon className="h-5 w-5 flex-shrink-0" />
            {active && (
              <span className="absolute -inset-1 bg-cream/10 rounded-full blur-sm" />
            )}
          </div>
          <span className={`font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${
            isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
          }`}>
            {el.label}
          </span>
          {active && isExpanded && (
            <ChevronRight className="h-4 w-4 ml-auto text-cream/60 flex-shrink-0" />
          )}
          
          {/* Tooltip for collapsed state */}
          {!isExpanded && (
            <div className="absolute left-full ml-3 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
              {el.label}
              <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-surface-elevated border-l border-b border-border rotate-45" />
            </div>
          )}
        </Link>
      )
    }

    return null
  }

  // Get current page label for header
  const getCurrentPageLabel = (): string => {
    for (const el of navigation) {
      if (isNavItem(el) && isItemActive(el, location.pathname)) {
        return el.label
      }
      if (isNavGroup(el)) {
        for (const item of el.items) {
          if (isItemActive(item, location.pathname)) {
            return item.label
          }
        }
      }
    }
    return 'Dashboard'
  }

  return (
    <div className="min-h-screen bg-void text-text-primary font-sans">
      
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex fixed left-0 top-0 h-full flex-col border-r border-border bg-void-deep/80 backdrop-blur-xl z-40 transition-all duration-300 ease-out ${
          isExpanded ? 'w-72' : 'w-16'
        }`}
      >
        {/* Logo Section with Collapse Button */}
        <div className={`p-4 flex items-center gap-2 ${isExpanded ? '' : 'px-3 justify-center'}`}>
          <Link to="/" className="flex items-center gap-3 group flex-1 min-w-0">
            <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
              <div className="absolute inset-0 bg-cream/10 rounded-xl border border-cream/20 group-hover:border-cream/40" />
              <img 
                src="/favinv.png" 
                alt="FavInv" 
                className="relative w-5 h-5 object-contain opacity-90 group-hover:opacity-100"
              />
            </div>
            {isExpanded && (
              <div className="overflow-hidden">
                <span className="text-sm font-semibold tracking-wide text-text-primary whitespace-nowrap">PRISM</span>
                <span className="block text-[10px] tracking-widest text-text-muted uppercase whitespace-nowrap">Investments</span>
              </div>
            )}
          </Link>
          {isExpanded && (
            <button
              onClick={toggleSidebar}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface/50 rounded-lg flex-shrink-0"
              title="Collapse sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Expand Button (when collapsed) */}
        {!isExpanded && (
          <div className="px-3 mb-2">
            <button
              onClick={toggleSidebar}
              className="w-full flex justify-center p-2 text-text-muted hover:text-text-primary hover:bg-surface/50 rounded-lg"
              title="Expand sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Market Data Ticker */}
        <MarketDataTicker collapsed={!isExpanded} />

        {/* Separator */}
        <div className={`h-px bg-border mx-4 mb-2 transition-all duration-300 ${isExpanded ? '' : 'mx-2'}`} />

        {/* Navigation */}
        <nav className={`flex-1 py-2 overflow-y-auto custom-scrollbar transition-all duration-300 ${isExpanded ? 'px-3' : 'px-2'}`}>
          {navigation.map((el, index) => renderNavElement(el, index))}
        </nav>

        {/* Bottom Actions */}
        <div className={`p-4 space-y-3 transition-all duration-300 ${isExpanded ? '' : 'px-2'}`}>
          <div className={`h-px bg-border transition-all duration-300 ${isExpanded ? 'mx-2' : 'mx-0'}`} />
          
          {/* Upload & Download Buttons */}
          <div className="space-y-2">
            <Link
              to="/investments"
              className={`glyph-btn glyph-btn-primary transition-all duration-300 ${
                isExpanded ? 'w-full justify-center' : 'w-full p-3 justify-center'
              }`}
              title={!isExpanded ? "Subir Documento" : undefined}
            >
              <Upload className="h-4 w-4 flex-shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                Upload Document
              </span>
            </Link>
            <a
              href="/releases/nexus-v1.0.apk"
              download
              className={`glyph-btn glyph-btn-secondary transition-all duration-300 ${
                isExpanded ? 'w-full justify-center' : 'w-full p-3 justify-center'
              }`}
              title={!isExpanded ? "Descargar App" : undefined}
            >
              <Download className="h-4 w-4 flex-shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                Download Android App
              </span>
            </a>
          </div>

          {/* Footer Info */}
          <div className={`flex items-center justify-between pt-2 transition-all duration-300 ${isExpanded ? 'px-2' : 'flex-col gap-2'}`}>
            <div className={`flex items-center gap-2 ${isExpanded ? '' : 'justify-center'}`}>
              <div className="w-6 h-6 flex items-center justify-center opacity-50">
                <img src="/favinv.png" alt="" className="w-4 h-4 object-contain" />
              </div>
              <span className={`text-xs text-text-muted overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                Nido
              </span>
            </div>
            <div className={`flex items-center gap-2 text-xs text-text-muted ${isExpanded ? '' : 'flex-col'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse flex-shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                En línea
              </span>
            </div>
          </div>
          <div className={`text-[10px] text-text-muted overflow-hidden transition-all duration-300 ${isExpanded ? 'px-2 w-auto opacity-100' : 'w-0 h-0 opacity-0'}`}>
            v1.0.0
          </div>
        </div>
      </aside>

      {/* Desktop Header (when sidebar collapsed) */}
      <header className="hidden lg:flex fixed top-0 left-16 right-0 h-16 items-center px-6 z-30 bg-void/50 backdrop-blur-sm">
        <h1 className="text-lg font-semibold text-text-primary">
          {getCurrentPageLabel()}
        </h1>
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
              <span className="text-sm font-semibold tracking-wide">PRISM</span>
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
          className={`absolute left-0 top-16 bottom-0 w-80 bg-void-deep border-r border-border flex flex-col transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-4">
              {navigation.map((el, index) => {
                // Section header
                if (isNavSection(el)) {
                  return (
                    <div 
                      key={`mobile-section-${index}`}
                      className="mt-6 mb-2 px-4 text-[10px] font-semibold tracking-widest text-text-muted uppercase"
                    >
                      {el.label}
                    </div>
                  )
                }
                
                // Group
                if (isNavGroup(el)) {
                  const GroupIcon = el.icon
                  const groupActive = isGroupActive(el, location.pathname)
                  const isGroupExpanded = expandedGroups.has(el.label)
                  
                  return (
                    <div key={`mobile-group-${index}`} className="mb-1">
                      <button
                        onClick={() => toggleGroup(el.label)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          groupActive 
                            ? 'text-cream bg-surface/80' 
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface/40'
                        }`}
                      >
                        <GroupIcon className={`h-5 w-5 flex-shrink-0 ${groupActive ? 'text-cream' : 'text-text-muted'}`} />
                        <span className="font-medium text-sm flex-1 text-left">{el.label}</span>
                        <ChevronDown 
                          className={`h-4 w-4 text-text-muted transition-transform duration-300 ${
                            isGroupExpanded ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ${
                        isGroupExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="mt-1 ml-4 pl-4 border-l border-border space-y-0.5">
                          {el.items.map((item, itemIndex) => {
                            const ItemIcon = item.icon
                            const itemActive = isItemActive(item, location.pathname)
                            
                            return (
                              <Link
                                key={`mobile-${el.label}-item-${itemIndex}`}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                  itemActive 
                                    ? 'text-cream bg-surface' 
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/30'
                                }`}
                              >
                                <ItemIcon className={`h-4 w-4 flex-shrink-0 ${itemActive ? 'text-cream' : 'text-text-muted'}`} />
                                <span className="text-sm font-medium flex-1">{item.label}</span>
                                {item.badge && (
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    item.badgeColor === 'cream' ? 'bg-cream/10 text-cream border-cream/20' :
                                    item.badgeColor === 'success' ? 'bg-success/10 text-success border-success/20' :
                                    'bg-surface text-text-secondary border-border'
                                  }`}>
                                    {item.badge}
                                  </span>
                                )}
                                {itemActive && <ChevronRight className="h-3 w-3 text-cream/60" />}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                }
                
                // Regular item
                if (isNavItem(el)) {
                  const Icon = el.icon
                  const active = isItemActive(el, location.pathname)
                  
                  return (
                    <Link
                      key={`mobile-item-${index}`}
                      to={el.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${
                        active 
                          ? 'bg-surface text-cream' 
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-cream' : 'text-text-muted'}`} />
                      <span className="font-medium text-sm flex-1">{el.label}</span>
                      {active && <ChevronRight className="h-4 w-4 text-cream/60" />}
                    </Link>
                  )
                }
                
                return null
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
            <a
              href="/releases/nexus-v1.0.apk"
              download
              className="glyph-btn glyph-btn-secondary w-full justify-center"
            >
              <Download className="h-4 w-4" />
              <span>Download Android App</span>
            </a>
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
        isExpanded ? 'lg:ml-72' : 'lg:ml-16'
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

import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Trees,
  FileText,
  Upload,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  MessageSquare,
  BarChart3,
  Smartphone,
  type LucideIcon
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import MarketDataTicker from './MarketDataTicker'

// Compact time display component for the header - First line: CHILE + time, Second line: long date
function CompactTimeDisplay() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatChileanTime = (date: Date): string => {
    return date.toLocaleTimeString('es-CL', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  const formatChileanDateLong = (date: Date): string => {
    return date.toLocaleDateString('es-CL', {
      timeZone: 'America/Santiago',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[12px] font-bold text-cream uppercase tracking-wider">Chile</span>
        <span className="font-mono text-[14px] text-text-primary font-semibold">
          {formatChileanTime(currentTime)}
        </span>
      </div>
      <div className="text-[11px] text-text-secondary capitalize">
        {formatChileanDateLong(currentTime)}
      </div>
    </div>
  )
}

// Mini clock for collapsed sidebar — just HH:MM
function CollapsedClock() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hhmm = currentTime.toLocaleTimeString('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <div className="flex items-center justify-center py-0.5 px-1 bg-surface/50 rounded-lg">
      <span className="font-mono text-[13px] text-text-secondary tracking-tight leading-none">{hhmm}</span>
    </div>
  )
}

interface LayoutProps {
  children: React.ReactNode
}

// Types for navigation structure
interface NavItemBase {
  label: string
  icon: LucideIcon
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

// Navigation structure - flat list of pages
const navigation: NavElement[] = [
  { path: '/', label: 'Portafolio', icon: LayoutDashboard },
  { path: '/investments', label: 'Inversiones', icon: FolderOpen },
  { path: '/analytics', label: 'Análisis', icon: BarChart3 },
  { path: '/land-analyzer', label: 'Terrenos', icon: Trees },
  { path: '/chat', label: 'Asistente', icon: MessageSquare },
  { path: '/files', label: 'Documentos', icon: FileText },
  { path: '/download', label: 'App Móvil', icon: Smartphone },
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

  // Render navigation element
  const renderNavElement = (el: NavElement, index: number) => {
    // Section header
    if (isNavSection(el)) {
      return (
        <div
          key={`section-${index}`}
          className={`mt-6 mb-2 px-4 text-[10px] font-semibold tracking-widest text-text-muted uppercase transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 mt-0 mb-0 overflow-hidden'
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
            className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 group ${isActive
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

            <span className={`font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
              }`}>
              {el.label}
            </span>

            {isExpanded && (
              <ChevronDown
                className={`h-4 w-4 ml-auto text-text-muted transition-transform duration-300 ${isGroupExpanded ? 'rotate-180' : ''
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
          <div className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded && isGroupExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
            <div className="mt-1 ml-4 pl-4 border-l border-border space-y-0.5">
              {el.items.map((item, itemIndex) => {
                const ItemIcon = item.icon
                const itemActive = isItemActive(item, location.pathname)

                return (
                  <Link
                    key={`${el.label}-item-${itemIndex}`}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group/item ${itemActive
                      ? 'text-cream bg-surface'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/30'
                      }`}
                  >
                    <ItemIcon className={`h-4 w-4 flex-shrink-0 ${itemActive ? 'text-cream' : 'text-text-muted group-hover/item:text-text-primary'}`} />
                    <span className="text-sm font-medium whitespace-nowrap flex-1">{item.label}</span>

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
          className={`flex items-center gap-3 rounded-xl transition-all duration-200 group relative mb-1 ${active
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
          <span className={`font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
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

  return (
    <div className="min-h-screen bg-void text-text-primary font-sans">

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-full flex-col border-r border-border bg-void-deep/80 backdrop-blur-xl z-40 transition-all duration-300 ease-out text-[0.9em] ${isExpanded ? 'w-72' : 'w-20'
          }`}
      >
        {/* Compact Header: Large Favicon (toggle) + Time/Date Panel */}
        <div className={`${isExpanded ? 'p-3 pb-2' : 'p-3 pb-0'}`}>
          <div className={`flex items-center gap-3 ${isExpanded ? '' : 'justify-center flex-col gap-1.5'}`}>
            {/* Large Favicon - Acts as sidebar toggle */}
            <button
              onClick={toggleSidebar}
              className="flex-shrink-0 relative group"
              title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 bg-surface/40 rounded-xl border border-border group-hover:bg-surface/50 transition-colors" />
                <img
                  src="/favinv.png"
                  alt="FavInv"
                  className="relative w-7 h-7 object-contain opacity-90"
                />
              </div>
            </button>

            {/* Time/Date Panel (only when expanded) */}
            {isExpanded && (
              <div className="flex-1 min-w-0 py-1.5 px-3 bg-surface/30 rounded-lg border border-border/30">
                <CompactTimeDisplay />
              </div>
            )}

            {/* Collapsed mini clock */}
            {!isExpanded && (
              <div className="w-full px-1">
                <CollapsedClock />
              </div>
            )}
          </div>
        </div>

        {/* Market Data Ticker (prices only when expanded) */}
        <MarketDataTicker collapsed={!isExpanded} showTime={false} />

        {/* Separator */}
        <div className={`h-px bg-border mx-4 mb-2 transition-all duration-300 ${isExpanded ? '' : 'mx-2'}`} />

        {/* Navigation */}
        <nav className={`flex-1 py-2 overflow-y-auto custom-scrollbar transition-all duration-300 ${isExpanded ? 'px-3' : 'px-2'}`}>
          {navigation.map((el, index) => renderNavElement(el, index))}
        </nav>

        {/* Bottom Actions */}
        <div className={`space-y-3 transition-all duration-300 ${isExpanded ? 'p-4' : 'p-2'}`}>
          <div className={`h-px bg-border transition-all duration-300 ${isExpanded ? 'mx-2' : 'mx-0'}`} />

          {/* Upload Button */}
          <div className="space-y-2">
            <Link
              to="/files"
              className={`glyph-btn glyph-btn-primary transition-all duration-300 ${isExpanded ? 'w-full justify-center' : 'w-full p-3 justify-center'
                }`}
              title={!isExpanded ? "Documentos" : undefined}
            >
              <Upload className="h-4 w-4 flex-shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                Documentos
              </span>
            </Link>
          </div>


        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-void/95 border-b border-border backdrop-blur-xl">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-surface/40 rounded-xl border border-border" />
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
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-void/90 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />

        {/* Mobile Sidebar Panel */}
        <aside
          className={`absolute left-0 top-16 bottom-0 w-80 bg-void-deep border-r border-border flex flex-col transition-transform duration-300 text-[0.9em] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${groupActive
                          ? 'text-cream bg-surface/80'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface/40'
                          }`}
                      >
                        <GroupIcon className={`h-5 w-5 flex-shrink-0 ${groupActive ? 'text-cream' : 'text-text-muted'}`} />
                        <span className="font-medium text-sm flex-1 text-left">{el.label}</span>
                        <ChevronDown
                          className={`h-4 w-4 text-text-muted transition-transform duration-300 ${isGroupExpanded ? 'rotate-180' : ''
                            }`}
                        />
                      </button>

                      <div className={`overflow-hidden transition-all duration-300 ${isGroupExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                        <div className="mt-1 ml-4 pl-4 border-l border-border space-y-0.5">
                          {el.items.map((item, itemIndex) => {
                            const ItemIcon = item.icon
                            const itemActive = isItemActive(item, location.pathname)

                            return (
                              <Link
                                key={`mobile-${el.label}-item-${itemIndex}`}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${itemActive
                                  ? 'text-cream bg-surface'
                                  : 'text-text-secondary hover:text-text-primary hover:bg-surface/30'
                                  }`}
                              >
                                <ItemIcon className={`h-4 w-4 flex-shrink-0 ${itemActive ? 'text-cream' : 'text-text-muted'}`} />
                                <span className="text-sm font-medium flex-1">{item.label}</span>

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
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${active
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
              to="/files"
              className="glyph-btn glyph-btn-primary w-full justify-center"
            >
              <Upload className="h-4 w-4" />
              <span>Documentos</span>
            </Link>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className={`transition-all duration-300 min-h-screen ${isExpanded ? 'lg:ml-72' : 'lg:ml-20'
        }`}>
        <div className="pt-20 lg:pt-8 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

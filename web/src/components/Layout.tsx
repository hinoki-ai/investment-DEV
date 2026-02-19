import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Trees, 
  FileText, 
  Brain,
  Upload,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/investments', label: 'Investments', icon: Trees },
  { path: '/files', label: 'Files', icon: FileText },
  { path: '/analysis', label: 'Analysis', icon: Brain },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <Trees className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block">
                  Family Investments
                </span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                to="/investments"
                className="btn-primary flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Link>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className={`
            lg:w-64 flex-shrink-0
            ${mobileMenuOpen ? 'block' : 'hidden lg:block'}
          `}>
            <div className="card p-4 sticky top-24">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path || 
                    (item.path !== '/' && location.pathname.startsWith(item.path))
                  
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                          ${isActive 
                            ? 'bg-primary-50 text-primary-700 font-medium' 
                            : 'text-gray-600 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
    User, Bell, Key, Globe, Moon, Sun,
    DollarSign, Save, ChevronRight, Shield
} from 'lucide-react'

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile')
    const [theme, setTheme] = useState('dark')
    const [currency, setCurrency] = useState('BRL')
    const [language, setLanguage] = useState('es')
    const [emailNotifs, setEmailNotifs] = useState(true)
    const [pushNotifs, setPushNotifs] = useState(false)
    const [apiKey] = useState('sk-live-xxxxxxxxxxxxxx')
    const [showKey, setShowKey] = useState(false)

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        // Simulated save
        alert('Configuración guardada exitosamente')
    }

    return (
        <div className="space-y-6 fade-in max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-surface-elevated border border-border">
                    <User className="h-6 w-6 text-cream" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Configuración</h1>
                    <p className="text-sm text-text-muted">Administra tus preferencias y cuenta</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Navigation Sidebar */}
                <div className="space-y-1 md:col-span-1">
                    {[
                        { id: 'profile', label: 'Perfil', icon: User },
                        { id: 'appearance', label: 'Apariencia', icon: Moon },
                        { id: 'notifications', label: 'Notificaciones', icon: Bell },
                        { id: 'integrations', label: 'API & Integraciones', icon: Key },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-surface border-border border text-cream shadow-sm'
                                : 'text-text-secondary hover:text-text-primary hover:bg-surface/50 border border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-cream' : 'text-text-muted'}`} />
                                <span className="text-sm font-medium">{tab.label}</span>
                            </div>
                            {activeTab === tab.id && <ChevronRight className="h-4 w-4 text-cream/50" />}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    <div className="glass-card p-6">
                        <form onSubmit={handleSave} className="space-y-8">

                            {/* Profile Settings */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                        <User className="h-4 w-4 text-cream-muted" />
                                        <h2 className="text-sm font-semibold tracking-widest text-cream-muted uppercase">Perfil Personal</h2>
                                    </div>

                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="w-20 h-20 rounded-full bg-surface-elevated border-2 border-border flex items-center justify-center relative overflow-hidden group cursor-pointer">
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-xs font-semibold text-white">Cambiar</span>
                                            </div>
                                            <User className="h-8 w-8 text-text-muted" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-text-primary">Foto de Perfil</h3>
                                            <p className="text-xs text-text-muted mt-1">PNG o JPG (Max. 2MB)</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-text-secondary">Nombre de Usuario</label>
                                            <input type="text" defaultValue="Hinoki" className="input-field" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-text-secondary">Correo Electrónico</label>
                                            <input type="email" defaultValue="admin@aramac.dev" className="input-field" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Appearance & Localization */}
                            {activeTab === 'appearance' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                            <Sun className="h-4 w-4 text-cream-muted" />
                                            <h2 className="text-sm font-semibold tracking-widest text-cream-muted uppercase">Tema Visual</h2>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 max-w-md">
                                            <label className={`relative flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${theme === 'light' ? 'bg-cream/5 border-cream/30' : 'bg-surface border-border hover:border-border-strong'}`}>
                                                <input type="radio" className="sr-only" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} />
                                                <Sun className={`h-6 w-6 mb-2 ${theme === 'light' ? 'text-cream' : 'text-text-muted'}`} />
                                                <span className={`text-sm font-medium ${theme === 'light' ? 'text-cream' : 'text-text-secondary'}`}>Claro</span>
                                            </label>
                                            <label className={`relative flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${theme === 'dark' ? 'bg-cream/10 border-cream text-cream shadow-glow' : 'bg-surface border-border hover:border-border-strong'}`}>
                                                <input type="radio" className="sr-only" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} />
                                                <Moon className={`h-6 w-6 mb-2 ${theme === 'dark' ? 'text-cream' : 'text-text-muted'}`} />
                                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-cream' : 'text-text-secondary'}`}>Oscuro (Preferencia)</span>
                                                {theme === 'dark' && <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-cream"></span>}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                            <Globe className="h-4 w-4 text-cream-muted" />
                                            <h2 className="text-sm font-semibold tracking-widest text-cream-muted uppercase">Regionalización</h2>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-text-secondary">Moneda Principal</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field pl-9">
                                                        <option value="BRL">BRL - Real Brasileño</option>
                                                        <option value="USD">USD - Dólar Estadounidense</option>
                                                        <option value="CLP">CLP - Peso Chileno</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-text-secondary">Idioma</label>
                                                <div className="relative">
                                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-field pl-9">
                                                        <option value="es">Español (Spanglish)</option>
                                                        <option value="en">English</option>
                                                        <option value="pt">Português</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                        <Bell className="h-4 w-4 text-cream-muted" />
                                        <h2 className="text-sm font-semibold tracking-widest text-cream-muted uppercase">Alertas del Portafolio</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="flex items-start justify-between p-4 rounded-xl border border-border bg-surface hover:border-border-strong transition-colors cursor-pointer">
                                            <div className="space-y-1">
                                                <span className="text-sm font-medium text-text-primary block">Alertas por Correo</span>
                                                <span className="text-xs text-text-muted block">Recibe un resumen semanal y alertas importantes de tu portafolio.</span>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer ml-4">
                                                <input type="checkbox" className="sr-only peer" checked={emailNotifs} onChange={() => setEmailNotifs(!emailNotifs)} />
                                                <div className="w-11 h-6 bg-surface-elevated rounded-full peer peer-checked:bg-cream peer-focus:ring-2 peer-focus:ring-cream/30 transition-all"></div>
                                                <div className="absolute left-[2px] top-[2px] bg-text-muted w-5 h-5 rounded-full peer-checked:translate-x-full peer-checked:bg-void transition-all"></div>
                                            </div>
                                        </label>

                                        <label className="flex items-start justify-between p-4 rounded-xl border border-border bg-surface hover:border-border-strong transition-colors cursor-pointer">
                                            <div className="space-y-1">
                                                <span className="text-sm font-medium text-text-primary block">Notificaciones Push (WebApp)</span>
                                                <span className="text-xs text-text-muted block">Alertas instantáneas cuando el AI termine de analizar documentos.</span>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer ml-4">
                                                <input type="checkbox" className="sr-only peer" checked={pushNotifs} onChange={() => setPushNotifs(!pushNotifs)} />
                                                <div className="w-11 h-6 bg-surface-elevated rounded-full peer peer-checked:bg-cream peer-focus:ring-2 peer-focus:ring-cream/30 transition-all"></div>
                                                <div className="absolute left-[2px] top-[2px] bg-text-muted w-5 h-5 rounded-full peer-checked:translate-x-full peer-checked:bg-void transition-all"></div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Integrations & API Keys */}
                            {activeTab === 'integrations' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                        <Shield className="h-4 w-4 text-cream-muted" />
                                        <h2 className="text-sm font-semibold tracking-widest text-cream-muted uppercase">Seguridad y API</h2>
                                    </div>

                                    <div className="p-4 rounded-xl border border-warning/20 bg-warning/5 space-y-3 mb-6">
                                        <div className="flex items-center gap-2">
                                            <Key className="h-4 w-4 text-warning" />
                                            <span className="text-sm font-semibold text-warning">API Key de Prisma</span>
                                        </div>
                                        <p className="text-xs text-warning/80">
                                            Usa esta clave para poder interactuar con Nexus a través de aplicaciones de terceros u otras integraciones. Mantén esto secreto.
                                        </p>
                                        <div className="flex items-center gap-2 pt-2">
                                            <input
                                                type={showKey ? "text" : "password"}
                                                value={apiKey}
                                                readOnly
                                                className="input-field font-mono text-xs flex-1"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowKey(!showKey)}
                                                className="px-3 py-2 rounded-lg bg-surface-elevated text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                                            >
                                                {showKey ? "Ocultar" : "Mostrar"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="pt-6 mt-6 border-t border-border flex justify-end gap-3">
                                <button type="button" className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-colors hover:bg-surface-elevated">
                                    Cancelar
                                </button>
                                <button type="submit" className="glyph-btn glyph-btn-primary py-2 px-5 flex items-center gap-2">
                                    <Save className="h-4 w-4" /> Guardar Cambios
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { useState, useRef, useEffect } from 'react'
import { HelpCircle, X } from 'lucide-react'

// ============================================================================
// BEGINNER-FRIENDLY TOOLTIP SYSTEM - ESPAÑOL
// ============================================================================
// Explicaciones en español para noobs, manteniendo terminología técnica en inglés

interface HelpTooltipProps {
  /** El término técnico que se explica */
  title?: string | React.ReactNode
  /** La explicación útil en español */
  content: React.ReactNode
  /** Opcional: ejemplo adicional */
  example?: string | React.ReactNode
  /** Posición del bubble */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Tamaño */
  size?: 'sm' | 'md' | 'lg'
  /** Opcional: mostrar label junto al icono */
  showLabel?: string
  /** Opcional: elemento trigger personalizado */
  children?: React.ReactNode
  /** Hover (default) o click */
  trigger?: 'hover' | 'click'
  /** Opcional: link para aprender más */
  learnMoreUrl?: string
}

export function HelpTooltip({
  title,
  content,
  example,
  position = 'top',
  size = 'md',
  showLabel,
  children,
  trigger = 'hover',
  learnMoreUrl,
}: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPinned(false)
        setIsVisible(false)
      }
    }

    if (isPinned) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isPinned])

  const showTooltip = () => {
    if (!isPinned) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setIsVisible(true)
    }
  }

  const hideTooltip = () => {
    if (!isPinned) {
      timeoutRef.current = setTimeout(() => setIsVisible(false), 150)
    }
  }

  const handleClick = () => {
    if (trigger === 'click') {
      setIsPinned(!isPinned)
      setIsVisible(!isPinned)
    }
  }

  const sizeClasses = {
    sm: 'w-56 text-xs',
    md: 'w-80 text-sm',
    lg: 'w-[28rem] text-sm',
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-surface-elevated',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-surface-elevated',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-surface-elevated',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-surface-elevated',
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={trigger === 'hover' ? showTooltip : undefined}
      onMouseLeave={trigger === 'hover' ? hideTooltip : undefined}
    >
      {children ? (
        <div onClick={handleClick} className="cursor-help">
          {children}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          onMouseEnter={trigger === 'hover' ? showTooltip : undefined}
          onMouseLeave={trigger === 'hover' ? hideTooltip : undefined}
          className="inline-flex items-center gap-1 text-cream-muted hover:text-cream transition-colors focus:outline-none group"
        >
          {showLabel && (
            <span className="text-xs text-cream-muted group-hover:text-cream transition-colors">
              {showLabel}
            </span>
          )}
          <HelpCircle
            className={`${isPinned ? 'text-cream' : ''} transition-colors`}
            style={{ width: showLabel ? '14px' : '16px', height: showLabel ? '14px' : '16px' }}
          />
        </button>
      )}

      {/* Tooltip Bubble */}
      {(isVisible || isPinned) && (
        <div
          className={`
            absolute z-50 ${positionClasses[position]} ${sizeClasses[size]}
            animate-in fade-in zoom-in-95 duration-200
          `}
        >
          <div className="relative">
            {/* Bubble Content */}
            <div className="bg-surface-elevated border border-cream/20 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Header con gradient */}
              <div className="bg-gradient-to-r from-cream/10 to-transparent px-4 py-2.5 border-b border-cream/10 flex items-center justify-between">
                {title && (
                  <span className="font-semibold text-cream text-sm">{title}</span>
                )}
                {isPinned && (
                  <button
                    onClick={() => {
                      setIsPinned(false)
                      setIsVisible(false)
                    }}
                    className="text-text-muted hover:text-text-primary transition-colors p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-text-secondary leading-relaxed">{content}</p>

                {example && (
                  <div className="mt-3 p-3 bg-surface rounded-lg border border-border">
                    <p className="text-xs text-cream-muted uppercase tracking-wider mb-1">Ejemplo</p>
                    <p className="text-sm text-text-secondary italic">{example}</p>
                  </div>
                )}

                {learnMoreUrl && (
                  <a
                    href={learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-cream hover:text-cream-light transition-colors"
                  >
                    Aprender más →
                  </a>
                )}

                {/* Tip para interacción */}
                {!isPinned && trigger === 'hover' && (
                  <p className="mt-3 text-[10px] text-text-muted">
                    Click para mantener abierto
                  </p>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 border-8 ${arrowClasses[position]}`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// LABEL WITH TOOLTIP - Para form labels
// ============================================================================

interface LabelWithTooltipProps {
  label: string
  tooltipTitle?: string
  tooltipContent: string
  tooltipExample?: string | undefined
  icon?: React.ElementType
  required?: boolean
}

export function LabelWithTooltip({
  label,
  tooltipTitle,
  tooltipContent,
  tooltipExample,
  icon: Icon,
  required,
}: LabelWithTooltipProps) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold tracking-widest text-cream-muted uppercase group">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span className="group-hover:text-cream/80 transition-colors">{label}</span>
      {required && <span className="text-error">*</span>}
      <HelpTooltip
        title={tooltipTitle || label}
        content={tooltipContent}
        example={tooltipExample}
        size="md"
      />
    </label>
  )
}

// ============================================================================
// BASE DE DATOS DE TOOLTIPS - Términos de Inversión para Noobs (Español)
// ============================================================================
// Movido a src/lib/tooltips.ts para evitar advertencias de Fast Refresh

export default HelpTooltip

import { useState } from 'react'
import {
  Trees,
  MapPin,
  DollarSign,
  Calendar,
  Tag,
  Percent,
  FileText,
  Hash,
  Globe
} from 'lucide-react'
import { Investment } from '../lib/api'
import { LabelWithTooltip } from './HelpTooltip'
import { INVESTMENT_TOOLTIPS } from '../lib/tooltips'

// ============================================================================
// TYPES
// ============================================================================
interface InvestmentFormData {
  name: string
  category: Investment['category']
  description: string
  address: string
  city: string
  state: string
  country: string
  purchase_price?: number
  purchase_date?: string
  current_value?: number
  land_area_hectares?: number
  zoning_type: string
  ownership_percentage: number
  status: Investment['status']
  tags: string[]
}

interface InvestmentFormProps {
  initialData?: Partial<InvestmentFormData>
  onSubmit: (data: InvestmentFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
  mode: 'create' | 'edit'
}

// ============================================================================
// CONSTANTS
// ============================================================================
const CATEGORIES: { value: Investment['category']; label: string; icon: string }[] = [
  { value: 'land', label: 'Land', icon: '🏞️' },
  { value: 'stocks', label: 'Stocks', icon: '📈' },
  { value: 'gold', label: 'Gold', icon: '🪙' },
  { value: 'crypto', label: 'Crypto', icon: '₿' },
  { value: 'real_estate', label: 'Real Estate', icon: '🏢' },
  { value: 'bonds', label: 'Bonds', icon: '📜' },
  { value: 'other', label: 'Other', icon: '📦' },
]

const STATUSES: { value: Investment['status']; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'sold', label: 'Sold' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_contract', label: 'Under Contract' },
]

const ZONING_TYPES = [
  'residential',
  'commercial',
  'industrial',
  'agricultural',
  'mixed',
  'rural',
  'urban',
  'conservation',
]

// ============================================================================
// FORM INPUT COMPONENT
// ============================================================================
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: React.ElementType
  hint?: string
  error?: string
  tooltip?: { title?: string; content: string; example?: string }
}

function FormInput({ label, icon: Icon, hint, error, className = '', tooltip, ...props }: FormInputProps) {
  return (
    <div className="space-y-1.5">
      {tooltip ? (
        <LabelWithTooltip
          label={label}
          icon={Icon}
          tooltipTitle={tooltip.title}
          tooltipContent={tooltip.content}
          tooltipExample={tooltip.example}
          required={props.required}
        />
      ) : (
        <label className="flex items-center gap-2 text-xs font-semibold tracking-widest text-cream-muted uppercase">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {label}
          {props.required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          className={`w-full px-4 py-2.5 bg-void border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cream/20 focus:border-cream/30 transition-all duration-200 ${error ? 'border-error' : 'border-border hover:border-border-strong'
            } ${className}`}
        />
      </div>
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}

// ============================================================================
// FORM SELECT COMPONENT
// ============================================================================
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  icon?: React.ElementType
  options: { value: string; label: string }[]
  error?: string
  tooltip?: { title?: string; content: string; example?: string }
}

function FormSelect({ label, icon: Icon, options, error, className = '', tooltip, ...props }: FormSelectProps) {
  return (
    <div className="space-y-1.5">
      {tooltip ? (
        <LabelWithTooltip
          label={label}
          icon={Icon}
          tooltipTitle={tooltip.title}
          tooltipContent={tooltip.content}
          tooltipExample={tooltip.example}
        />
      ) : (
        <label className="flex items-center gap-2 text-xs font-semibold tracking-widest text-cream-muted uppercase">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {label}
        </label>
      )}
      <div className="relative">
        <select
          {...props}
          className={`w-full px-4 py-2.5 bg-void border rounded-lg text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cream/20 focus:border-cream/30 transition-all duration-200 ${error ? 'border-error' : 'border-border hover:border-border-strong'
            } ${className}`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}

// ============================================================================
// FORM TEXTAREA COMPONENT
// ============================================================================
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  icon?: React.ElementType
  hint?: string
  error?: string
  tooltip?: { title?: string; content: string; example?: string }
}

function FormTextarea({ label, icon: Icon, hint, error, className = '', tooltip, ...props }: FormTextareaProps) {
  return (
    <div className="space-y-1.5">
      {tooltip ? (
        <LabelWithTooltip
          label={label}
          icon={Icon}
          tooltipTitle={tooltip.title}
          tooltipContent={tooltip.content}
          tooltipExample={tooltip.example}
        />
      ) : (
        <label className="flex items-center gap-2 text-xs font-semibold tracking-widest text-cream-muted uppercase">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`w-full px-4 py-2.5 bg-void border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cream/20 focus:border-cream/30 transition-all duration-200 resize-none ${error ? 'border-error' : 'border-border hover:border-border-strong'
          } ${className}`}
      />
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}

// ============================================================================
// TAGS INPUT COMPONENT
// ============================================================================
function TagsInput({
  tags,
  onChange
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
      setInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="space-y-1.5">
      <LabelWithTooltip
        label="Tags"
        icon={Tag}
        tooltipContent={INVESTMENT_TOOLTIPS.tags.content}
        tooltipExample={INVESTMENT_TOOLTIPS.tags.example}
      />
      <div className="flex flex-wrap gap-2 p-2 bg-void border border-border rounded-lg min-h-[46px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface text-text-secondary text-sm rounded-full border border-border"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-text-muted hover:text-error transition-colors"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? 'Add tags...' : ''}
          className="flex-1 min-w-[80px] bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none text-sm"
        />
      </div>
      <p className="text-xs text-text-muted">Press Enter to add a tag</p>
    </div>
  )
}

// ============================================================================
// CATEGORY SELECTOR
// ============================================================================
function CategorySelector({
  value,
  onChange
}: {
  value: Investment['category']
  onChange: (category: Investment['category']) => void
}) {
  return (
    <div className="space-y-1.5">
      <LabelWithTooltip
        label="Category"
        icon={Trees}
        tooltipContent={INVESTMENT_TOOLTIPS.category.content}
        tooltipExample={INVESTMENT_TOOLTIPS.category.example}
      />
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onChange(cat.value)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 ${value === cat.value
                ? 'bg-cream/10 border-cream/30 text-cream'
                : 'bg-void border-border text-text-secondary hover:border-border-strong hover:text-text-primary'
              }`}
          >
            <span className="text-xl">{cat.icon}</span>
            <span className="text-[10px] font-medium hidden sm:block">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN INVESTMENT FORM
// ============================================================================
export function InvestmentForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode
}: InvestmentFormProps) {
  const [formData, setFormData] = useState<InvestmentFormData>({
    name: '',
    category: 'land',
    description: '',
    address: '',
    city: '',
    state: '',
    country: 'Brazil',
    purchase_price: undefined,
    purchase_date: '',
    current_value: undefined,
    land_area_hectares: undefined,
    zoning_type: '',
    ownership_percentage: 100,
    status: 'active',
    tags: [],
    ...initialData
  })

  const [errors, setErrors] = useState<Partial<Record<keyof InvestmentFormData, string>>>({})
  const [activeSection, setActiveSection] = useState<'basic' | 'financial' | 'details'>('basic')

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof InvestmentFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (formData.purchase_price !== undefined && formData.purchase_price < 0) {
      newErrors.purchase_price = 'Price cannot be negative'
    }

    if (formData.current_value !== undefined && formData.current_value < 0) {
      newErrors.current_value = 'Value cannot be negative'
    }

    if (formData.ownership_percentage < 0 || formData.ownership_percentage > 100) {
      newErrors.ownership_percentage = 'Must be between 0 and 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  const updateField = <K extends keyof InvestmentFormData>(field: K, value: InvestmentFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const isLand = formData.category === 'land'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section Tabs */}
      <div className="flex items-center gap-1 p-1 bg-void rounded-lg border border-border">
        {[
          { id: 'basic' as const, label: 'Basic Info' },
          { id: 'financial' as const, label: 'Financial' },
          { id: 'details' as const, label: 'Details' },
        ].map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${activeSection === section.id
                ? 'bg-surface text-cream'
                : 'text-text-muted hover:text-text-primary'
              }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Basic Info Section */}
      {activeSection === 'basic' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-200">
          <CategorySelector
            value={formData.category}
            onChange={(cat) => updateField('category', cat)}
          />

          <FormInput
            label="Investment Name"
            icon={Trees}
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g., Beachfront Property in Florianópolis"
            error={errors.name}
            required
            tooltip={INVESTMENT_TOOLTIPS.name}
          />

          <FormSelect
            label="Status"
            icon={Tag}
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value as Investment['status'])}
            options={STATUSES}
            tooltip={INVESTMENT_TOOLTIPS.status}
          />

          <FormTextarea
            label="Description"
            icon={FileText}
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe this investment..."
            rows={4}
            tooltip={INVESTMENT_TOOLTIPS.description}
          />

          <TagsInput
            tags={formData.tags}
            onChange={(tags) => updateField('tags', tags)}
          />
        </div>
      )}

      {/* Financial Section */}
      {activeSection === 'financial' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-200">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Purchase Price"
              icon={DollarSign}
              type="number"
              min="0"
              step="0.01"
              value={formData.purchase_price || ''}
              onChange={(e) => updateField('purchase_price', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="0.00"
              error={errors.purchase_price}
              tooltip={INVESTMENT_TOOLTIPS.purchasePrice}
            />

            <FormInput
              label="Current Value"
              icon={DollarSign}
              type="number"
              min="0"
              step="0.01"
              value={formData.current_value || ''}
              onChange={(e) => updateField('current_value', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="0.00"
              error={errors.current_value}
              tooltip={INVESTMENT_TOOLTIPS.currentValue}
            />
          </div>

          <FormInput
            label="Purchase Date"
            icon={Calendar}
            type="date"
            value={formData.purchase_date}
            onChange={(e) => updateField('purchase_date', e.target.value)}
            tooltip={INVESTMENT_TOOLTIPS.purchaseDate}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Ownership %"
              icon={Percent}
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.ownership_percentage}
              onChange={(e) => updateField('ownership_percentage', Number(e.target.value))}
              error={errors.ownership_percentage}
              tooltip={INVESTMENT_TOOLTIPS.ownershipPercentage}
            />

            {isLand && (
              <FormInput
                label="Land Area (hectares)"
                icon={Hash}
                type="number"
                min="0"
                step="0.0001"
                value={formData.land_area_hectares || ''}
                onChange={(e) => updateField('land_area_hectares', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0.00"
                tooltip={INVESTMENT_TOOLTIPS.landArea}
              />
            )}
          </div>

          {isLand && (
            <FormSelect
              label="Zoning Type"
              icon={Tag}
              value={formData.zoning_type}
              onChange={(e) => updateField('zoning_type', e.target.value)}
              options={[
                { value: '', label: 'Select zoning...' },
                ...ZONING_TYPES.map(z => ({ value: z, label: z.charAt(0).toUpperCase() + z.slice(1) }))
              ]}
              tooltip={INVESTMENT_TOOLTIPS.zoningType}
            />
          )}
        </div>
      )}

      {/* Details Section */}
      {activeSection === 'details' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-200">
          <FormInput
            label="Address"
            icon={MapPin}
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Street address"
            tooltip={INVESTMENT_TOOLTIPS.address}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="City"
              icon={MapPin}
              value={formData.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="City"
              tooltip={INVESTMENT_TOOLTIPS.city}
            />

            <FormInput
              label="State/Province"
              icon={MapPin}
              value={formData.state}
              onChange={(e) => updateField('state', e.target.value)}
              placeholder="State"
              tooltip={INVESTMENT_TOOLTIPS.state}
            />
          </div>

          <FormInput
            label="Country"
            icon={Globe}
            value={formData.country}
            onChange={(e) => updateField('country', e.target.value)}
            placeholder="Country"
            tooltip={INVESTMENT_TOOLTIPS.country}
          />
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <div className="flex gap-2">
          {activeSection !== 'basic' && (
            <button
              type="button"
              onClick={() => setActiveSection(activeSection === 'financial' ? 'basic' : 'financial')}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
            >
              Previous
            </button>
          )}
          {activeSection !== 'details' && (
            <button
              type="button"
              onClick={() => setActiveSection(activeSection === 'basic' ? 'financial' : 'details')}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
            >
              Next
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium bg-cream text-void hover:bg-cream/90 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-void/30 border-t-void rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              mode === 'create' ? 'Create Investment' : 'Save Changes'
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

export type { InvestmentFormData }

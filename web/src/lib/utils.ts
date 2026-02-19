import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const categoryColors: Record<string, string> = {
  land: 'bg-green-100 text-green-800',
  stocks: 'bg-blue-100 text-blue-800',
  gold: 'bg-yellow-100 text-yellow-800',
  crypto: 'bg-purple-100 text-purple-800',
  real_estate: 'bg-orange-100 text-orange-800',
  bonds: 'bg-gray-100 text-gray-800',
  other: 'bg-gray-100 text-gray-800',
}

export const categoryLabels: Record<string, string> = {
  land: 'Land',
  stocks: 'Stocks',
  gold: 'Gold',
  crypto: 'Crypto',
  real_estate: 'Real Estate',
  bonds: 'Bonds',
  other: 'Other',
}

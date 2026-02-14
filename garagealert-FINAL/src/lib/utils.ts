import { type ClassValue, clsx } from 'clsx'

// Simple classname merger (no need for clsx dependency, this is lightweight)
export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// Format UK phone number to E.164 (+447xxxxxxxxx)
export function formatUKPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('07')) {
    cleaned = '+44' + cleaned.slice(1)
  }
  if (cleaned.startsWith('44') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }
  return cleaned
}

// Validate UK mobile number
export function isValidUKMobile(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  return /^(\+44|0)7\d{9}$/.test(cleaned)
}

// Validate email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Format date to UK style (13 Feb 2026)
export function formatDateUK(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Format date relative (e.g., "in 7 days", "3 days ago")
export function formatDateRelative(dateString: string | null): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0) return `In ${diffDays} days`
  return `${Math.abs(diffDays)} days ago`
}

// Get status colour class
export function getStatusColor(status: string): string {
  switch (status) {
    case 'delivered':
    case 'sent':
    case 'active':
    case 'opted_in':
      return 'bg-emerald-50 text-emerald-700'
    case 'failed':
    case 'bounced':
    case 'cancelled':
    case 'past_due':
    case 'opted_out':
      return 'bg-red-50 text-red-700'
    case 'pending':
    case 'trialing':
      return 'bg-amber-50 text-amber-700'
    case 'skipped':
      return 'bg-gray-100 text-gray-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

// Get MOT status colour based on due date
export function getMOTStatusColor(dueDateString: string | null): string {
  if (!dueDateString) return 'text-gray-400'
  const dueDate = new Date(dueDateString)
  const now = new Date()
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'text-red-600' // Overdue
  if (diffDays <= 30) return 'text-amber-600' // Due within 30 days
  return 'text-emerald-600' // Not due yet
}

// Format UK vehicle registration for display (AB12 CDE)
export function formatRegistration(reg: string): string {
  const cleaned = reg.replace(/\s/g, '').toUpperCase()
  if (cleaned.length === 7) {
    return cleaned.slice(0, 4) + ' ' + cleaned.slice(4)
  }
  return cleaned
}

// Render template by replacing {tokens} with actual values
export function renderTemplate(
  template: string,
  data: Record<string, string>
): string {
  let rendered = template
  for (const [key, value] of Object.entries(data)) {
    rendered = rendered.replaceAll(`{${key}}`, value || '')
  }
  return rendered
}

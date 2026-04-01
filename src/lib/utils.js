export const CURRENCIES = [
  { code: 'PHP', symbol: '₱', label: 'Philippine Peso (PHP)' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (JPY)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (SGD)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (AUD)' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar (CAD)' },
]

export const PAY_SCHEDULES = [
  { value: 'semi-monthly', label: 'Semi-monthly (1st & 15th)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Every 2 weeks' },
  { value: 'tri-weekly', label: 'Every 3 weeks' },
  { value: 'quad-weekly', label: 'Every 4 weeks' },
]

export const RECUR_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Every 2 weeks' },
  { value: 'tri-weekly', label: 'Every 3 weeks' },
  { value: 'quad-weekly', label: 'Every 4 weeks' },
  { value: 'semi-monthly', label: 'Semi-monthly (1st & 15th)' },
  { value: 'monthly', label: 'Monthly' },
]

export function fmt(n, symbol = '₱') {
  return symbol + Number(n || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function getInitials(name) {
  return (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function getCurrencySymbol(code) {
  return CURRENCIES.find(c => c.code === code)?.symbol || '₱'
}

export function confirmDelete(name = 'this item') {
  return window.confirm(`Delete ${name}? This cannot be undone.`)
}

export function validateAmount(val, fieldName = 'Amount') {
  const n = parseFloat(val)
  if (isNaN(n) || n <= 0) return `${fieldName} must be a positive number.`
  return null
}

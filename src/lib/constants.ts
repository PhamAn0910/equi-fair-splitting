// Member color palette for paint assignments
export const MEMBER_COLORS = [
  { name: 'sage', class: 'member-sage', hex: '#6B7B5F' },
  { name: 'terracotta', class: 'member-terracotta', hex: '#C17F59' },
  { name: 'ocean', class: 'member-ocean', hex: '#5B8A8A' },
  { name: 'lavender', class: 'member-lavender', hex: '#9B8AC4' },
  { name: 'sunset', class: 'member-sunset', hex: '#E8A87C' },
  { name: 'rose', class: 'member-rose', hex: '#C4A4A4' },
  { name: 'mint', class: 'member-mint', hex: '#7DB9A5' },
  { name: 'slate', class: 'member-slate', hex: '#708090' },
] as const;

export type MemberColor = typeof MEMBER_COLORS[number];

// Group background colors
export const GROUP_COLORS = [
  { name: 'sage', bgHex: '#E8EDE5', hex: '#6B7B5F' },
  { name: 'terracotta', bgHex: '#F5EBE6', hex: '#C17F59' },
  { name: 'ocean', bgHex: '#E5EDED', hex: '#5B8A8A' },
  { name: 'lavender', bgHex: '#EDEAF3', hex: '#9B8AC4' },
  { name: 'sunset', bgHex: '#F8F0E8', hex: '#E8A87C' },
] as const;

export type GroupColor = typeof GROUP_COLORS[number];

export function getGroupColor(colorIndex: number): GroupColor {
  return GROUP_COLORS[colorIndex % GROUP_COLORS.length];
}

// Get the next available color for a new member
export function getNextColor(usedColors: string[]): MemberColor {
  const available = MEMBER_COLORS.find(c => !usedColors.includes(c.name));
  return available || MEMBER_COLORS[usedColors.length % MEMBER_COLORS.length];
}

// Supported currencies
export const CURRENCIES = [
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimals: 0 },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimals: 0 },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

// Currency formatter - plain number with correct decimals
export function formatCurrency(amount: number, currencyCode: string = 'EUR'): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(amount);
}

// Get currency symbol
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCIES.find(c => c.code === currencyCode)?.symbol || '';
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

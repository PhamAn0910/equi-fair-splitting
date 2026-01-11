// Member color palette for paint assignments
export const MEMBER_COLORS = [
  { name: 'coral', class: 'member-coral', hex: '#E8734A', hsl: '12 76% 61%' },
  { name: 'teal', class: 'member-teal', hex: '#2DD4BF', hsl: '172 66% 50%' },
  { name: 'amber', class: 'member-amber', hex: '#F59E0B', hsl: '38 92% 50%' },
  { name: 'violet', class: 'member-violet', hex: '#A855F7', hsl: '270 60% 60%' },
  { name: 'lime', class: 'member-lime', hex: '#84CC16', hsl: '84 81% 44%' },
  { name: 'pink', class: 'member-pink', hex: '#EC4899', hsl: '330 81% 60%' },
  { name: 'cyan', class: 'member-cyan', hex: '#06B6D4', hsl: '192 91% 50%' },
  { name: 'orange', class: 'member-orange', hex: '#F97316', hsl: '25 95% 53%' },
] as const;

export type MemberColor = typeof MEMBER_COLORS[number];

// Get the next available color for a new member
export function getNextColor(usedColors: string[]): MemberColor {
  const available = MEMBER_COLORS.find(c => !usedColors.includes(c.name));
  return available || MEMBER_COLORS[usedColors.length % MEMBER_COLORS.length];
}

// Currency formatter - no currency symbol for now
export function formatCurrency(amount: number, _currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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

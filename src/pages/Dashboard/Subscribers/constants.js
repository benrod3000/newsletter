export const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: '🟢 Active' },
  { value: 'at_risk', label: '🟡 At Risk' },
  { value: 'cold', label: '🔴 Cold' },
]

export const HEALTH_STYLES = {
  active: 'bg-brutal-green text-white',
  at_risk: 'bg-brutal-yellow text-brutal-fg',
  cold: 'bg-brutal-red text-white',
}

export const STATUS_STYLES = {
  draft: 'bg-brutal-surface text-brutal-fg border-2 border-brutal-fg',
  scheduled: 'bg-brutal-yellow text-brutal-fg border-2 border-brutal-fg',
  sent: 'bg-brutal-green text-white border-2 border-brutal-fg',
}

export const AUDIENCE_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed Subscribers' },
  { value: 'all', label: 'All Subscribers' },
  { value: 'pending', label: 'Pending Verification' },
  { value: 'geo', label: '📍 Geo-Targeted' },
]

export function generateSubjects(name, content) {
  if (!name) return []
  const headingMatch = content.match(/<h[123][^>]*>(.*?)<\/h[123]>/i)
  const firstHeading = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '').trim() : null
  const words = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w.length > 4)
  const freq = {}
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1 })
  const topWord = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || name

  return [
    firstHeading ? `${firstHeading}` : `${name} — Latest Update`,
    `Everything you need to know about ${topWord}`,
    `Is your ${name.toLowerCase()} working for you?`,
    `3 ways to improve your ${topWord}`,
  ]
}

export function getAudienceLabel(a, lists) {
  if (a?.startsWith('list:')) return lists.find((l) => l.id === a.slice(5))?.name || a
  const match = AUDIENCE_OPTIONS.find((opt) => opt.value === a)
  return match ? match.label : a
}

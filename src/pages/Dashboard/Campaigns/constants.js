export const STATUS_STYLES = {
  draft:     'bg-brutal-surface text-brutal-fg border-2 border-brutal-fg',
  scheduled: 'bg-brutal-yellow text-brutal-fg border-2 border-brutal-fg',
  queued:    'bg-blue-100 text-blue-800 border-2 border-blue-400',
  preparing: 'bg-blue-100 text-blue-800 border-2 border-blue-400',
  sending:   'bg-brutal-yellow text-brutal-fg border-2 border-brutal-fg animate-pulse',
  retrying:  'bg-orange-100 text-orange-800 border-2 border-orange-400',
  paused:    'bg-brutal-surface text-brutal-muted border-2 border-brutal-fg',
  completed: 'bg-brutal-green text-white border-2 border-brutal-fg',
  sent:      'bg-brutal-green text-white border-2 border-brutal-fg',
  failed:    'bg-brutal-red text-white border-2 border-brutal-fg',
  cancelled: 'bg-brutal-surface text-brutal-muted border-2 border-brutal-fg line-through',
}

export const STATUS_LABELS = {
  draft:     'Draft',
  scheduled: 'Scheduled',
  queued:    'Queued',
  preparing: 'Preparing',
  sending:   'Sending',
  retrying:  'Retrying',
  paused:    'Paused',
  completed: 'Sent',
  sent:      'Sent',
  failed:    'Failed',
  cancelled: 'Cancelled',
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
    firstHeading ? `${firstHeading}` : `${name} · Latest Update`,
    `Everything you need to know about ${topWord}`,
    `Is your ${name.toLowerCase()} working for you?`,
    `3 ways to improve your ${topWord}`,
  ]
}

// Built-in starting points offered on a blank "New Broadcast", so users don't
// have to face an empty editor. Kept to nodes the TipTap editor (StarterKit +
// Link + Image) actually renders - no tables/floats - since anything else
// gets silently stripped on parse.
export const STARTER_TEMPLATES = [
  {
    key: 'two-voice-update',
    name: 'Friendly two-voice update',
    description: 'A casual, two-person voice for a weekly or monthly check-in.',
    subject: "This week's update",
    html: `<h1>Hey {{first_name}} 👋</h1>
<p><strong>Frankie:</strong> Quick one from us this week -</p>
<p><strong>Nadia:</strong> we've got a few things worth your time.</p>
<h2>What's new</h2>
<ul>
  <li>First highlight goes here</li>
  <li>Second highlight goes here</li>
  <li>Third highlight goes here</li>
</ul>
<p><a href="https://example.com">Read the full story →</a></p>
<p><em>See you next time,<br>Frankie &amp; Nadia</em></p>
<p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>`,
  },
]

export function getAudienceLabel(a, lists) {
  if (a?.startsWith('list:')) return lists.find((l) => l.id === a.slice(5))?.name || a
  const match = AUDIENCE_OPTIONS.find((opt) => opt.value === a)
  return match ? match.label : a
}

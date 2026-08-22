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
]

/*
 * `{ value: 'geo', label: '📍 Geo-Targeted' }` stood here and is gone with the
 * map it revealed.
 *
 * It never worked. Selecting it showed a GeoFilter whose value was written to a
 * `geoAudience` state that nothing read - no save or send payload carried it,
 * and the campaign PATCH allowlist would not have accepted `geo_filter` anyway.
 * So a radius could be drawn on a campaign, appear accepted, and the send went
 * to everybody. No campaign has ever been stored with this audience.
 *
 * Not replaced with a working version, because targeting by list is the same
 * capability with better properties: a list can be looked at before an
 * irreversible send, it answers "who got this?" afterwards, and it keeps one
 * implementation of what a radius means instead of three that have to agree -
 * the list route, the export and the send path have already disagreed twice,
 * once over miles versus kilometres and once over how many areas count.
 *
 * The route is Contacts -> radius filter -> "Create list from these" -> pick the
 * list here, under Custom Lists.
 *
 * What this gives up is freshness: a list is a snapshot, so someone who signs up
 * inside the radius tomorrow is not in it. If that becomes a real need, the
 * shape is letting a campaign target a *saved filter* - which already exists on
 * Contacts and would cover status, dates and search too - not a geo-specific
 * system on the send path.
 *
 * `geo` remains a valid audience in the API and in campaigns_audience_check.
 * Nothing produces it now, and tightening the constraint is churn with no
 * benefit; see src/lib/__tests__/audience-values.test.ts in newsletter-core.
 */

/*
 * `generateSubjects` stood here and is gone with the "Suggest" button it fed.
 *
 * It was word-frequency templating, not suggestion: pick the most common long word
 * in the body and drop it into four fixed sentences. On a real newsletter that
 * produced lines like "3 ways to improve your subscribers" - grammatical, confident,
 * and about nothing. A subject line is the one piece of copy that decides whether the
 * rest is read, which makes plausible-but-empty the worst thing to put in front of
 * someone writing one.
 */

/**
 * A human label for a campaign's audience.
 *
 * `lists` defaults to empty because every call site omitted it, and the only branch
 * that reads it is the `list:` one - which no campaign could reach, because the
 * database rejected list audiences outright. Fixing that constraint made list
 * campaigns saveable and turned this line into a crash: `undefined is not an object
 * (evaluating 'lists.find')`, which took the whole Broadcasts page down through the
 * error boundary the first time one was created.
 *
 * Falling back to the raw `list:<uuid>` when the list is not found is deliberate. It
 * is ugly and it is true; showing a placeholder instead would hide that a campaign is
 * aimed at a list that has since been deleted.
 */
export function getAudienceLabel(a, lists = []) {
  if (a?.startsWith('list:')) return lists.find((l) => l.id === a.slice(5))?.name || a
  const match = AUDIENCE_OPTIONS.find((opt) => opt.value === a)
  return match ? match.label : a
}

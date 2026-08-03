/**
 * Rendering for audit log entries.
 *
 * Shared so the Settings panel and the dashboard card cannot drift into
 * describing the same event two different ways.
 *
 * The backend stores `action` as a stable snake_case identifier and `details` as
 * free-form jsonb. Neither is written for a human to read, and the previous UI
 * did `action.replace(/_/g, ' ')`, which turned `credentials_changed` into
 * "credentials changed" with no indication of *which* credentials. The point of
 * this log is that an owner can tell at a glance whether something needs
 * attention, so the summary carries the detail that decides that.
 */

/**
 * Actions worth visually flagging.
 *
 * Bulk data movement, credential changes and team changes are the events where
 * "I did not do that" is the reaction we want to make easy to have. Ordinary
 * sign-ins and settings edits are recorded but not highlighted, because
 * highlighting everything highlights nothing.
 */
export const SENSITIVE_ACTIONS = new Set([
  'subscriber_exported',
  'subscriber_imported',
  'subscriber_deleted',
  'credentials_changed',
  'member_invited',
  'member_removed',
  'member_role_changed',
  'login_failed',
  'password_changed',
  'totp_disabled',
])

/** Plain-language label for an action, falling back to the raw identifier. */
const LABELS = {
  login: 'Signed in',
  login_failed: 'Failed sign-in attempt',
  logout: 'Signed out',
  password_changed: 'Password changed',
  totp_enabled: 'Two-factor enabled',
  totp_disabled: 'Two-factor disabled',
  totp_verified: 'Two-factor verified',
  campaign_sent: 'Campaign sent',
  campaign_scheduled: 'Campaign scheduled',
  subscriber_exported: 'Contacts exported',
  subscriber_imported: 'Contacts imported',
  subscriber_deleted: 'Contacts deleted',
  credentials_changed: 'Sending credentials changed',
  settings_changed: 'Settings changed',
  member_invited: 'Team member added',
  member_removed: 'Team member removed',
  member_role_changed: 'Team member role changed',
  automation_changed: 'Automation changed',
  api_key_created: 'API key created',
}

/**
 * A one-line summary of an entry, including the number or field that makes it
 * meaningful. Returns a label alone when there is nothing useful to add.
 */
export function describeAudit(log) {
  const label = LABELS[log?.action] || String(log?.action || 'Unknown action').replace(/_/g, ' ')
  const d = log?.details || {}

  switch (log?.action) {
    case 'subscriber_exported':
      return typeof d.count === 'number' ? `${label} (${d.count.toLocaleString()} contacts)` : label
    case 'subscriber_imported':
      return typeof d.processed === 'number' ? `${label} (${d.processed.toLocaleString()} contacts)` : label
    case 'subscriber_deleted':
      return typeof d.deleted === 'number' ? `${label} (${d.deleted.toLocaleString()} contacts)` : label
    case 'credentials_changed': {
      // Field names only. The backend deliberately never records the values.
      const fields = Array.isArray(d.credentials) ? d.credentials : []
      if (!fields.length) return label
      const pretty = fields.map((f) => f.replace(/_api_key$/, '').replace(/_/g, ' ')).join(', ')
      const cleared = Array.isArray(d.cleared) && d.cleared.length
      return `${label}: ${pretty}${cleared ? ' (removed)' : ''}`
    }
    case 'member_invited':
      return d.invited_email ? `${label}: ${d.invited_email} as ${d.role || 'member'}` : label
    case 'campaign_scheduled':
      return d.subject ? `${label}: "${d.subject}"` : label
    case 'settings_changed': {
      const fields = Array.isArray(d.fields) ? d.fields : []
      return fields.length ? `${label}: ${fields.join(', ')}` : label
    }
    default:
      return label
  }
}

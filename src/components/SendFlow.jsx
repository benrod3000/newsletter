import { useEffect, useRef, useState } from 'react'
import { campaignsAPI } from '../lib/api'
import { useToast } from './Toast'
import Btn from './ui/Button'
import { Eye, Send, Users, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { canAdvance, contentFingerprint, describeFilters } from '../lib/send-flow-rules'

/**
 * The four steps between finishing a draft and mailing an audience.
 *
 * Previously there was one button. Pressing it opened a confirm dialog and the
 * next click sent to everybody, and the dialog itself was misleading: it read
 * `campaign.sent_count` as the recipient count, which is how many were *already*
 * sent, so on an unsent draft it was 0, fell through `||`, and the text said
 * "will be sent to all confirmed subscribers" with no number. Beneath it sat a
 * cost estimate computed from an invented 100 recipients and attributed to AWS
 * SES regardless of the workspace's actual provider.
 *
 * So the single most dangerous action in the product was guarded by a dialog in
 * which all three figures were fabricated. This replaces it.
 *
 * The test send is required, not encouraged. Sending is irreversible and the
 * common failure is not "wrong audience" but "broken rendering", which no
 * amount of confirming catches and one real email does. Editing the subject or
 * body after testing invalidates it, because a test of different content proves
 * nothing about what would go out.
 */

const STEPS = [
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'test', label: 'Test', icon: Send },
  { key: 'confirm', label: 'Recipients', icon: Users },
  { key: 'send', label: 'Send', icon: CheckCircle },
]

/**
 * Mounted per send rather than kept alive and reset, so every field starts from
 * its initial value by construction. That includes `testedFingerprint`: closing
 * and reopening the flow requires a fresh test, which is the safe direction to
 * fail and avoids resetting five pieces of state in an effect.
 */
export default function SendFlow({ campaign, workspaceId, ownEmail, onClose, onSent }) {
  const toast = useToast()
  const [step, setStep] = useState('preview')
  const [testEmail, setTestEmail] = useState(ownEmail || '')
  const [testing, setTesting] = useState(false)
  const [testedFingerprint, setTestedFingerprint] = useState(null)
  const [estimate, setEstimate] = useState(null)
  const [estimateLoading, setEstimateLoading] = useState(false)
  const [estimateError, setEstimateError] = useState(null)
  const [sending, setSending] = useState(false)
  // 'now' | 'later'. Defaults to 'now' because that is what pressing Send used
  // to do, or rather what it was labelled as doing.
  const [when, setWhen] = useState('now')
  const [sendAt, setSendAt] = useState('')
  const [nowTs, setNowTs] = useState(null)
  const dialogRef = useRef(null)

  const fingerprint = contentFingerprint(campaign)
  // A test only counts for the content it was sent for.
  const testValid = testedFingerprint !== null && testedFingerprint === fingerprint
  const testStale = testedFingerprint !== null && testedFingerprint !== fingerprint

  // The picker refuses past times in the browser, and the API refuses them
  // again on arrival - `min` on an input is a hint, not a guarantee.
  //
  // Read from state rather than calling Date.now() during render: "now" is not
  // a pure value, and a dialog left open long enough for the chosen time to
  // pass should notice, which a value captured once at mount would not.
  const minLocal = nowTs === null ? undefined : toLocalInputValue(new Date(nowTs + 60_000))
  const scheduleValid =
    when === 'now' || (Boolean(sendAt) && nowTs !== null && new Date(sendAt).getTime() > nowTs)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  // Ticks so a time that was valid when picked stops being valid once it passes.
  // Deferred, following Analytics.jsx, so the effect body itself never calls
  // setState synchronously.
  useEffect(() => {
    queueMicrotask(() => setNowTs(Date.now()))
    const id = setInterval(() => setNowTs(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !sending) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sending, onClose])

  useEffect(() => {
    if (step !== 'confirm' || !campaign?.id) return
    let cancelled = false

    async function loadEstimate() {
      setEstimateLoading(true)
      setEstimateError(null)
      try {
        const { data } = await campaignsAPI.audienceEstimate(workspaceId, campaign.id)
        if (!cancelled) setEstimate(data?.count !== undefined ? data : data?.data ?? null)
      } catch (err) {
        // No fallback number. Showing a guess here is what the old dialog did.
        const msg = err?.response?.data?.error
        if (!cancelled) setEstimateError(typeof msg === 'object' ? msg?.message : msg || 'Could not calculate recipients')
      } finally {
        if (!cancelled) setEstimateLoading(false)
      }
    }

    loadEstimate()
    return () => { cancelled = true }
  }, [step, campaign?.id, workspaceId])

  async function handleTest() {
    const email = testEmail.trim()
    if (!email) return
    setTesting(true)
    try {
      await campaignsAPI.sendTest(workspaceId, campaign.id, email)
      setTestedFingerprint(fingerprint)
      toast.addToast(`Test sent to ${email}. Check it renders before continuing.`, 'success')
    } catch (err) {
      const msg = err?.response?.data?.error
      toast.addToast(typeof msg === 'object' ? msg?.message : msg || 'Failed to send test', 'error')
    } finally {
      setTesting(false)
    }
  }

  async function handleSend() {
    if (when === 'later' && !scheduleValid) return
    setSending(true)
    try {
      if (when === 'later') {
        // datetime-local yields wall-clock text with no zone ("2026-08-18T09:00").
        // new Date() reads that in the browser's timezone, which is the one the
        // person picking it is thinking in, and toISOString converts to the UTC
        // the API stores.
        await campaignsAPI.schedule(workspaceId, campaign.id, new Date(sendAt).toISOString())
        toast.addToast(`Scheduled for ${formatWhen(sendAt)}.`, 'success')
      } else {
        const { data } = await campaignsAPI.send(workspaceId, campaign.id)
        const body = data?.data ?? data
        // A send too large for one invocation finishes in the background. Saying
        // "sent" here would be a claim the response does not support.
        if (body?.remaining > 0) {
          toast.addToast(
            `Sending. ${body.sentCount?.toLocaleString() ?? 0} delivered so far, ${body.remaining.toLocaleString()} still going out.`,
            'success'
          )
        } else {
          toast.addToast(`Sent to ${body?.sentCount?.toLocaleString() ?? recipientCount?.toLocaleString() ?? 0}.`, 'success')
        }
      }
      onSent?.(campaign.id, { scheduled: when === 'later' })
    } catch (err) {
      const msg = err?.response?.data?.error
      toast.addToast(
        typeof msg === 'object' ? msg?.message : msg || (when === 'later' ? 'Failed to schedule' : 'Failed to send'),
        'error'
      )
      setSending(false)
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step)
  const recipientCount = estimate?.count

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brutal-fg/40 p-4">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Send newsletter"
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-3 border-brutal-fg bg-white shadow-brutal focus:outline-none"
      >
        {/* Progress */}
        <div className="border-b-3 border-brutal-fg p-4 flex items-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = i < stepIndex
            const current = i === stepIndex
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1 last:flex-none">
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 border-2 border-brutal-fg text-[10px] font-bold uppercase tracking-wider ${
                    current ? 'bg-brutal-yellow' : done ? 'bg-brutal-green text-white' : 'bg-white text-brutal-muted'
                  }`}
                >
                  <Icon size={12} />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-brutal-fg/20" />}
              </div>
            )
          })}
        </div>

        <div className="p-6">
          {step === 'preview' && (
            <div className="space-y-4">
              <h3 className="font-heading text-2xl uppercase tracking-wide">Preview</h3>
              <div className="border-2 border-brutal-fg bg-brutal-bg p-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">Subject</p>
                <p className="text-sm font-bold">{campaign?.subject || <span className="text-brutal-red">No subject set</span>}</p>
              </div>
              {/*
                srcDoc, not src: the preview must render the exact HTML held in
                the draft. sandbox with no allow-scripts because this is
                customer-authored content being rendered inside the dashboard.
              */}
              <iframe
                title="Newsletter preview"
                srcDoc={campaign?.editor_html || '<p style="font-family:sans-serif;padding:2rem;color:#888">This newsletter is empty.</p>'}
                sandbox=""
                className="w-full h-[360px] border-3 border-brutal-fg bg-white"
              />
              <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider">
                This is the HTML that will be sent. Images and fonts may render differently in each email client.
              </p>
            </div>
          )}

          {step === 'test' && (
            <div className="space-y-4">
              <h3 className="font-heading text-2xl uppercase tracking-wide">Send yourself a test</h3>
              <p className="text-xs text-brutal-fg/70">
                Required before sending. A preview cannot show you how a real inbox will render this,
                and sending to your audience cannot be undone.
              </p>

              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-label="Test recipient email"
                  className="flex-1 px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10"
                />
                <Btn variant="secondary" size="md" onClick={handleTest} disabled={testing || !testEmail.trim()}>
                  {testing ? 'Sending...' : 'Send test'}
                </Btn>
              </div>

              {testValid && (
                <div className="border-3 border-brutal-green bg-brutal-green/5 p-3 flex items-start gap-2">
                  <CheckCircle size={16} className="text-brutal-green shrink-0 mt-0.5" />
                  <p className="text-xs font-bold">Test sent. Open it and check it looks right before continuing.</p>
                </div>
              )}

              {testStale && (
                <div className="border-3 border-brutal-yellow-dark bg-brutal-yellow/10 p-3 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-brutal-yellow-dark shrink-0 mt-0.5" />
                  <p className="text-xs font-bold">
                    The subject or body changed after your test. Send another so you are checking what will actually go out.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <h3 className="font-heading text-2xl uppercase tracking-wide">Confirm recipients</h3>

              {estimateLoading && (
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brutal-muted">
                  <Loader2 size={14} className="animate-spin" /> Counting recipients
                </div>
              )}

              {estimateError && (
                <div className="border-3 border-brutal-red bg-brutal-red/5 p-4">
                  <p className="text-xs font-bold text-brutal-red">{estimateError}</p>
                  <p className="text-[10px] text-brutal-muted mt-1">
                    Sending is blocked until the recipient count can be confirmed.
                  </p>
                </div>
              )}

              {!estimateLoading && !estimateError && estimate && (
                <>
                  <div className="border-3 border-brutal-fg bg-brutal-bg p-6 text-center">
                    <p className="text-5xl font-heading tracking-tight">{recipientCount?.toLocaleString()}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted mt-1">
                      {recipientCount === 1 ? 'person will receive this' : 'people will receive this'}
                    </p>
                  </div>

                  <div className="border-2 border-brutal-fg p-3 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">Matching</p>
                    <p className="text-xs font-bold">{describeFilters(estimate)}</p>
                  </div>

                  {recipientCount === 0 && (
                    <div className="border-3 border-brutal-yellow-dark bg-brutal-yellow/10 p-3">
                      <p className="text-xs font-bold">
                        Nobody matches these filters, so this send would reach no one.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 'send' && (
            <div className="space-y-4">
              <h3 className="font-heading text-2xl uppercase tracking-wide">Ready to send</h3>
              <div className="border-3 border-brutal-fg bg-brutal-bg p-4 space-y-2">
                <Row label="Subject" value={campaign?.subject} />
                <Row label="Recipients" value={recipientCount?.toLocaleString()} />
                <Row label="Tested" value={testValid ? 'Yes' : 'No'} />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mb-2">
                  When
                </legend>
                <div className="grid sm:grid-cols-2 gap-2">
                  <WhenOption
                    checked={when === 'now'}
                    onChange={() => setWhen('now')}
                    label="Send now"
                    hint="Goes out immediately"
                  />
                  <WhenOption
                    checked={when === 'later'}
                    onChange={() => setWhen('later')}
                    label="Schedule"
                    hint="Pick a date and time"
                  />
                </div>

                {when === 'later' && (
                  <div className="space-y-1 pt-1">
                    <label
                      htmlFor="send-at"
                      className="block text-[10px] font-bold uppercase tracking-wider text-brutal-muted"
                    >
                      Send at ({timeZoneLabel()})
                    </label>
                    <input
                      id="send-at"
                      type="datetime-local"
                      value={sendAt}
                      min={minLocal}
                      onChange={(e) => setSendAt(e.target.value)}
                      className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10"
                    />
                    {sendAt && !scheduleValid && (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-red">
                        That time has already passed
                      </p>
                    )}
                  </div>
                )}
              </fieldset>

              <div className="border-3 border-brutal-fg bg-brutal-yellow/15 p-3">
                <p className="text-xs font-bold">
                  {when === 'later'
                    ? scheduleValid
                      ? `This will go out on ${formatWhen(sendAt)} and cannot be undone once it starts. You can unschedule it before then.`
                      : 'Pick a time in the future.'
                    : 'This cannot be undone. Once sending starts, the emails are on their way.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-3 border-brutal-fg p-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={stepIndex === 0 ? onClose : () => setStep(STEPS[stepIndex - 1].key)}
            disabled={sending}
            className="px-4 py-2 border-3 border-brutal-fg bg-white font-bold text-[10px] uppercase tracking-wider hover:bg-brutal-surface transition disabled:opacity-50"
          >
            {stepIndex === 0 ? 'Cancel' : 'Back'}
          </button>

          {step !== 'send' ? (
            <Btn
              variant="primary"
              size="md"
              onClick={() => setStep(STEPS[stepIndex + 1].key)}
              disabled={!canAdvance(step, { testValid, estimate, estimateLoading, estimateError })}
            >
              {advanceLabel(step, { testValid })}
            </Btn>
          ) : (
            <Btn
              variant="primary"
              size="md"
              onClick={handleSend}
              disabled={sending || !testValid || !recipientCount || !scheduleValid}
            >
              {sending
                ? when === 'later' ? 'Scheduling...' : 'Sending...'
                : when === 'later'
                  ? 'Schedule'
                  : `Send to ${recipientCount?.toLocaleString() ?? 0}`}
            </Btn>
          )}
        </div>
      </div>
    </div>
  )
}

function WhenOption({ checked, onChange, label, hint }) {
  return (
    <label
      className={`flex items-start gap-2 p-3 border-3 border-brutal-fg cursor-pointer transition ${
        checked ? 'bg-brutal-yellow' : 'bg-white hover:bg-brutal-surface'
      }`}
    >
      <input
        type="radio"
        name="send-when"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 accent-brutal-fg"
      />
      <span className="space-y-0.5">
        <span className="block text-xs font-bold uppercase tracking-wider">{label}</span>
        <span className="block text-[10px] text-brutal-muted">{hint}</span>
      </span>
    </label>
  )
}

/**
 * A Date as the "YYYY-MM-DDTHH:mm" that datetime-local expects, in local time.
 * toISOString() would be UTC and would shift the value the user sees by their
 * offset, so the arithmetic is done against the local getters instead.
 */
function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

function formatWhen(localValue) {
  const d = new Date(localValue)
  if (Number.isNaN(d.getTime())) return 'None'
  return d.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function timeZoneLabel() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time'
  } catch {
    return 'local time'
  }
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
      <span className="text-brutal-muted">{label}</span>
      <span className="text-brutal-fg truncate ml-3">{value || 'None'}</span>
    </div>
  )
}

function advanceLabel(step, { testValid }) {
  if (step === 'preview') return 'Looks right →'
  if (step === 'test') return testValid ? 'I checked it →' : 'Send a test first'
  return 'Continue →'
}

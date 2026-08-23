/**
 * Feature flags.
 *
 * One module so a capability is switched on in exactly one place, rather than
 * by finding every screen that mentions it.
 */

/**
 * SMS sending, off by default.
 *
 * Not "unfinished" - the email pipeline is a durable queue with per-recipient
 * rows, a FOR UPDATE SKIP LOCKED claim, consent re-checked at dispatch and a
 * recovery job. The SMS path shares none of it: it sends in a `for` loop inside
 * the request handler, caps the audience at 500 rows without saying so, writes
 * no job and no per-recipient state, records no events, and has no idempotency.
 * A timeout partway through leaves no record of who was already texted, so
 * pressing send again texts them again.
 *
 * That is not a rough edge to polish. Turning it off is the honest state until
 * SMS goes through the same machinery as email, and the next SMS work should be
 * that unification rather than an improvement to the fork.
 *
 * The whole surface goes together on purpose. Hiding only the send button
 * leaves a settings tab, an analytics page, a test-send and a widget type all
 * implying a feature that cannot deliver - which reads as broken rather than
 * unbuilt, and is a worse impression than absence.
 *
 * Set VITE_SMS_ENABLED=true to work on it locally. The backend refuses
 * independently (see SMS_ENABLED in newsletter-core), so flipping this alone
 * shows the UI without making it send.
 */
export const SMS_ENABLED = import.meta.env.VITE_SMS_ENABLED === 'true'

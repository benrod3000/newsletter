import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile widget.
 *
 * The script can fail to load for reasons that have nothing to do with the user
 * being a bot: ad blockers, privacy extensions, corporate DNS, strict CSP, or a
 * Cloudflare outage. Previously that failure was silent — no token was ever
 * produced, and any form gating its submit button on that token became
 * permanently unusable with no explanation.
 *
 * Every failure path now reports through `onError`, and callers are expected to
 * let the user submit anyway: the server verifies the token regardless, so a
 * broken client-side widget must never be a client-side lockout.
 */

// Cloudflare's documented always-passes test key, used for local development.
const TEST_SITE_KEY = "1x00000000000000000000AA";
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || TEST_SITE_KEY;

/** How long to wait for the script before declaring it unavailable. */
const LOAD_TIMEOUT_MS = 10000;

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

export default function Turnstile({ onVerify, onExpire, onError }) {
  const ref = useRef(null);
  const widgetId = useRef(null);
  const [ready, setReady] = useState(false);

  // Keep the latest callbacks without re-running the render effect. Assigned in
  // an effect rather than during render — refs must not be written while
  // rendering.
  const handlers = useRef({ onVerify, onExpire, onError });
  useEffect(() => {
    handlers.current = { onVerify, onExpire, onError };
  }, [onVerify, onExpire, onError]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (window.turnstile) {
      setReady(true);
      return;
    }

    let settled = false;
    const fail = (reason) => {
      if (settled) return;
      settled = true;
      handlers.current.onError?.(reason);
    };

    const timer = setTimeout(
      () => fail("Security check timed out. You can still try to continue."),
      LOAD_TIMEOUT_MS
    );

    // Another mount may already have injected the tag.
    let script = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const handleLoad = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      setReady(true);
    };
    const handleError = () => {
      clearTimeout(timer);
      fail("Security check could not load. You can still try to continue.");
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    return () => {
      clearTimeout(timer);
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, []);
  /* eslint-enable */

  useEffect(() => {
    if (!ready || !ref.current || !window.turnstile) return;

    if (widgetId.current) {
      window.turnstile.remove(widgetId.current);
    }

    try {
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (token) => handlers.current.onVerify?.(token),
        "expired-callback": () => handlers.current.onExpire?.(),
        "error-callback": () =>
          handlers.current.onError?.("Security check failed. You can still try to continue."),
        "timeout-callback": () =>
          handlers.current.onError?.("Security check timed out. You can still try to continue."),
      });
    } catch {
      handlers.current.onError?.("Security check is unavailable. You can still try to continue.");
    }

    return () => {
      if (widgetId.current) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [ready]);

  return <div ref={ref} className="turnstile-widget" />;
}

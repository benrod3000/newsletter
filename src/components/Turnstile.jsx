import { useEffect, useRef, useState } from "react";

const SITE_KEY = "0x4AAAAAAD23X8AsPUCySDiU";

export default function Turnstile({ onVerify, onExpire }) {
  const ref = useRef(null);
  const widgetId = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!window.turnstile) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => setReady(true);
      document.body.appendChild(script);
    } else {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready || !ref.current) return;
    if (widgetId.current) {
      window.turnstile.remove(widgetId.current);
    }
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: SITE_KEY,
      callback: (token) => onVerify && onVerify(token),
      "expired-callback": () => onExpire && onExpire(),
    });

    return () => {
      if (widgetId.current) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [ready]);

  return <div ref={ref} className="turnstile-widget" />;
}

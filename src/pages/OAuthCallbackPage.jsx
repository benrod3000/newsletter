import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get("token");
    const workspaceId = params.get("workspaceId");
    const email = params.get("email");
    const role = params.get("role");

    if (token && workspaceId && email) {
      setAuth({ token, workspaceId, email, role: role || "owner" });
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login?oauth_error=missing_params", { replace: true });
    }
  }, []);

  return (
    <main className="min-h-screen bg-brutal-bg flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-4 w-4 bg-brutal-fg animate-pulse mx-auto" />
        <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">Completing sign in...</p>
      </div>
    </main>
  );
}

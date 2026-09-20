import { FormEvent, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Activity, ArrowRight, BarChart3, Droplets, Leaf, LockKeyhole } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function Login() {
  const { user, login, loading } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  if (user) return <Navigate to={(location.state as any)?.from || "/"} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    try { await login(email, password); }
    catch (e) { setError(e instanceof Error ? e.message : "Sign in failed."); }
  };

  return <main className="login-page">
    <section className="login-story">
      <img
        className="login-stc-logo"
        src={`${import.meta.env.BASE_URL}stc-logo-white.png`}
        alt="stc"
      />
      <div className="story-copy">
        <span className="eyebrow">COW operations · Kingdom of Saudi Arabia</span>
        <h1>Energy intelligence for every site.</h1>
        <p>Monitor consumption, emissions, fuel readiness and operational risk from one national command center.</p>
        <div className="feature-row">
          <span><BarChart3 /> Energy</span><span><Leaf /> CO₂</span><span><Droplets /> Fuel</span><span><Activity /> Alerts</span>
        </div>
      </div>
      <div className="orb orb-one"/><div className="orb orb-two"/>
    </section>
    <section className="login-panel">
      <form onSubmit={submit} className="login-card">
        <div className="login-icon"><LockKeyhole /></div>
        <span className="eyebrow purple">Secure access</span>
        <h2>Welcome back</h2>
        <p>Sign in to the stc COW Energy Management Platform.</p>
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com" autoComplete="email" required /></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required /></label>
        {error && <div className="form-error">{error}</div>}
        <button disabled={loading}>{loading ? "Signing in…" : "Sign in"}<ArrowRight /></button>
        {!isSupabaseConfigured && <div className="demo-note"><strong>Preview mode</strong><br/>Use any valid email and password. Supabase authentication activates automatically after environment setup.</div>}
      </form>
      <footer>Powered by ACES · Mission Critical Infrastructure</footer>
    </section>
  </main>;
}

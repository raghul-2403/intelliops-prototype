import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

    if (profileError) {
      setError("Login worked, but the profile was not found.");
      setLoading(false);
      return;
    }

    onLogin(profile);
    setLoading(false);
  }

  return (
    <main className="login-page">
      <section className="login-layout">
        <div className="login-visual">
          <div className="login-visual-glow" />

          <img
            className="login-guardian-image"
            src="/meera-raghavan.jpg"
            alt="Cold Chain Guardian operations icon"
          />

          <p className="login-visual-label">
            HUMAN OVERSIGHT
          </p>

          <h2>
            Protect every shipment
            <br />
            before it is too late.
          </h2>

          <p className="login-visual-description">
            IntelliOps connects live signals, field teams, and
            recovery decisions in one cold-chain workspace.
          </p>

          <div className="login-visual-tags">
            <span>Temperature aware</span>
            <span>Driver connected</span>
            <span>Recovery ready</span>
          </div>
        </div>

        <section className="login-card">
          <div className="login-brand-mark">IO</div>

          <p className="eyebrow">SAP INTELLIOPS</p>

          <h1>Cold Chain Guardian</h1>

          <p className="login-description">
            Sign in to continue.
          </p>

          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                required
              />
            </label>

            {error && (
              <p className="login-error">{error}</p>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="demo-logins">
            <p>Demo access</p>
            <small>
              Coordinator and driver accounts are enabled.
            </small>
          </div>
        </section>
      </section>
    </main>
  );
}
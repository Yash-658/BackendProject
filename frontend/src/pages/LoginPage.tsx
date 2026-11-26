import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api";
import { ErrorBanner } from "../components";
import { useAuth } from "../context/AuthContext";

interface LocationState {
  from?: { pathname?: string };
  registeredUsername?: string;
}

export function LoginPage() {
  const { login, sessionMessage, clearSessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;

  const [username, setUsername] = useState(state?.registeredUsername ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination = state?.from?.pathname || "/problems";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    clearSessionMessage();

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      navigate(destination, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to sign in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-container">
      <div className="card auth-card">
        <h1>Sign in</h1>
        <p className="muted-text">
          Sign in with your username and password to submit solutions and view your
          submissions.
        </p>

        {sessionMessage && (
          <div className="alert alert-warning" role="status">
            {sessionMessage}
          </div>
        )}

        {state?.registeredUsername && !sessionMessage && (
          <div className="alert alert-success" role="status">
            Account created for <strong>{state.registeredUsername}</strong>. You can sign
            in now.
          </div>
        )}

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSubmit} className="stack-md" noValidate>
          <div className="form-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </section>
  );
}

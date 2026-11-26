import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage, registerUser } from "../api";
import { ErrorBanner } from "../components";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername) {
      setError("Username is required.");
      return;
    }
    if (trimmedUsername.length > 50) {
      setError("Username must be 50 characters or fewer.");
      return;
    }
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await registerUser({
        username: trimmedUsername,
        email: trimmedEmail,
        password,
      });
      navigate("/login", {
        replace: true,
        state: { registeredUsername: created.username },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-container">
      <div className="card auth-card">
        <h1>Create an account</h1>
        <p className="muted-text">
          Register a new user account to solve problems and track your submissions.
        </p>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSubmit} className="stack-md" noValidate>
          <div className="form-field">
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              type="text"
              autoComplete="username"
              maxLength={50}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
}

import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { isAuthenticated, username, userId, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/problems");
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div className="navbar-left">
          <Link to="/problems" className="brand">
            <span className="brand-mark" aria-hidden="true">
              {"</>"}
            </span>
            <span>CodeJudge</span>
          </Link>

          <nav className="nav-links" aria-label="Primary navigation">
            <NavLink
              to="/problems"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              Problems
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink
                  to="/submissions"
                  className={({ isActive }) =>
                    isActive ? "nav-link nav-link-active" : "nav-link"
                  }
                >
                  My Submissions
                </NavLink>
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    isActive ? "nav-link nav-link-active" : "nav-link"
                  }
                >
                  Users
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              <span className="user-pill" title="Signed in user">
                {username ?? `User #${userId ?? "?"}`}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

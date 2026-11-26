import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, listUsers } from "../api";
import { EmptyState, ErrorBanner, TableSkeleton } from "../components";
import { useAuth } from "../context/AuthContext";
import type { UserResponse } from "../types";

export function UsersPage() {
  const { userId } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listUsers(signal);
      setUsers(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(getErrorMessage(err, "Failed to load users."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchUsers(controller.signal);
    return () => controller.abort();
  }, [fetchUsers]);

  return (
    <section className="stack-lg">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="muted-text">
            Registered accounts returned by <code>GET /users</code>.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => void fetchUsers()}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} columns={3} />
      ) : error ? (
        <ErrorBanner message={error} onRetry={() => void fetchUsers()} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="No registered user accounts were returned."
        />
      ) : (
        <div className="table-wrapper card">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Username</th>
                <th scope="col">Email</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isCurrentUser = userId !== null && user.id === userId;
                return (
                  <tr key={user.id}>
                    <td className="mono-cell">#{user.id}</td>
                    <td>
                      {user.username}{" "}
                      {isCurrentUser && <span className="badge badge-info">You</span>}
                    </td>
                    <td>{user.email}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

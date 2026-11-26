import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteProblem, getErrorMessage, listProblems } from "../api";
import {
  ConfirmDialog,
  DifficultyBadge,
  EmptyState,
  ErrorBanner,
  ProblemFormModal,
  TableSkeleton,
  TestCaseModal,
} from "../components";
import { useAuth } from "../context/AuthContext";
import type { Problem, TestCaseResponse } from "../types";

export function ProblemsPage() {
  const { isAuthenticated } = useAuth();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [testCaseProblem, setTestCaseProblem] = useState<Problem | null>(null);
  const [deletingProblem, setDeletingProblem] = useState<Problem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchProblems = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listProblems(signal);
      setProblems(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(getErrorMessage(err, "Failed to load problems."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchProblems(controller.signal);
    return () => controller.abort();
  }, [fetchProblems]);

  const filteredProblems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return problems;
    }
    return problems.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.difficulty.toLowerCase().includes(query) ||
        String(p.id).includes(query)
    );
  }, [problems, searchQuery]);

  async function handleConfirmDelete() {
    if (!deletingProblem) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteProblem(deletingProblem.id);
      const deletedTitle = deletingProblem.title;
      setDeletingProblem(null);
      setStatusBanner(`Deleted problem "${deletedTitle}".`);
      await fetchProblems();
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete problem."));
    } finally {
      setIsDeleting(false);
    }
  }

  function handleProblemSaved(saved: Problem, action: "created" | "updated") {
    setStatusBanner(`Successfully ${action} problem "${saved.title}".`);
    void fetchProblems();
  }

  function handleTestCaseAdded(created: TestCaseResponse) {
    setStatusBanner(
      `Added test case #${created.id} to problem #${created.problem_id}.`
    );
  }

  return (
    <section className="stack-lg">
      <div className="page-header">
        <div>
          <h1>Problems</h1>
          <p className="muted-text">
            Browse coding problems and submit Python solutions for asynchronous judging.
          </p>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateOpen(true)}
          >
            + New Problem
          </button>
        )}
      </div>

      {statusBanner && (
        <div className="alert alert-success" role="status">
          <span>{statusBanner}</span>
          <button
            type="button"
            className="btn-icon"
            aria-label="Dismiss notification"
            onClick={() => setStatusBanner(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="toolbar">
        <div className="search-field">
          <label htmlFor="problem-search" className="sr-only">
            Filter problems
          </label>
          <input
            id="problem-search"
            type="search"
            placeholder="Filter by title, difficulty, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => void fetchProblems()}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={4} />
      ) : error ? (
        <ErrorBanner message={error} onRetry={() => void fetchProblems()} />
      ) : problems.length === 0 ? (
        <EmptyState
          title="No problems yet"
          description={
            isAuthenticated
              ? "Create your first problem (admin account required) to get started."
              : "Sign in with an admin account to create problems."
          }
          action={
            isAuthenticated ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCreateOpen(true)}
              >
                + New Problem
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary">
                Sign in
              </Link>
            )
          }
        />
      ) : filteredProblems.length === 0 ? (
        <EmptyState
          title="No matching problems"
          description={`No problems match "${searchQuery}".`}
          action={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSearchQuery("")}
            >
              Clear filter
            </button>
          }
        />
      ) : (
        <div className="table-wrapper card">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Title</th>
                <th scope="col">Difficulty</th>
                <th scope="col" className="text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((problem) => (
                <tr key={problem.id}>
                  <td className="mono-cell">#{problem.id}</td>
                  <td>
                    <Link to={`/problems/${problem.id}`} className="table-link">
                      {problem.title}
                    </Link>
                  </td>
                  <td>
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </td>
                  <td className="text-right">
                    <div className="row-actions">
                      <Link
                        to={`/problems/${problem.id}`}
                        className="btn btn-primary btn-xs"
                      >
                        Solve
                      </Link>
                      {isAuthenticated && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => setEditingProblem(problem)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => setTestCaseProblem(problem)}
                          >
                            + Test Case
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-xs"
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingProblem(problem);
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProblemFormModal
        isOpen={isCreateOpen}
        mode="create"
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(saved) => handleProblemSaved(saved, "created")}
      />

      <ProblemFormModal
        isOpen={Boolean(editingProblem)}
        mode="edit"
        initialProblem={editingProblem}
        onClose={() => setEditingProblem(null)}
        onSuccess={(saved) => handleProblemSaved(saved, "updated")}
      />

      {testCaseProblem && (
        <TestCaseModal
          isOpen={Boolean(testCaseProblem)}
          problemId={testCaseProblem.id}
          problemTitle={testCaseProblem.title}
          onClose={() => setTestCaseProblem(null)}
          onSuccess={handleTestCaseAdded}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingProblem)}
        title="Delete Problem"
        message={
          deletingProblem
            ? `Are you sure you want to delete "${deletingProblem.title}" (ID #${deletingProblem.id})? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete Problem"
        isSubmitting={isDeleting}
        error={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setDeletingProblem(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </section>
  );
}

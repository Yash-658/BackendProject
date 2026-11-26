import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createSubmission,
  deleteProblem,
  getErrorMessage,
  getProblem,
  getSubmission,
  listSubmissions,
} from "../api";
import {
  ConfirmDialog,
  DifficultyBadge,
  EmptyState,
  ErrorBanner,
  LoadingSpinner,
  ProblemFormModal,
  SubmissionStatusBadge,
  TestCaseModal,
} from "../components";
import { useAuth } from "../context/AuthContext";
import type { Problem, SubmissionResponse, TestCaseResponse } from "../types";

const IN_PROGRESS_STATUSES = new Set(["pending", "judging"]);

const STARTER_PYTHON = `# Read from stdin with input() or sys.stdin.read()\n`;

export function ProblemDetailPage() {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const parsedId = Number(problemId);
  const isValidId = Number.isInteger(parsedId) && parsedId > 0;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(STARTER_PYTHON);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTestCaseOpen, setIsTestCaseOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchProblemData = useCallback(
    async (signal?: AbortSignal) => {
      if (!isValidId) {
        setLoadError("Invalid problem ID.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getProblem(parsedId, signal);
        setProblem(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setLoadError(getErrorMessage(err, "Failed to load problem."));
      } finally {
        setIsLoading(false);
      }
    },
    [isValidId, parsedId]
  );

  const fetchProblemSubmissions = useCallback(
    async (signal?: AbortSignal) => {
      if (!isAuthenticated || !isValidId) {
        setSubmissions([]);
        return;
      }
      setIsLoadingSubmissions(true);
      setSubmissionsError(null);
      try {
        const all = await listSubmissions(signal);
        const matching = all
          .filter((item) => item.problem_id === parsedId)
          .sort((a, b) => b.id - a.id);
        setSubmissions(matching);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setSubmissionsError(getErrorMessage(err, "Failed to load your submissions."));
      } finally {
        setIsLoadingSubmissions(false);
      }
    },
    [isAuthenticated, isValidId, parsedId]
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchProblemData(controller.signal);
    return () => controller.abort();
  }, [fetchProblemData]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchProblemSubmissions(controller.signal);
    return () => controller.abort();
  }, [fetchProblemSubmissions]);

  const pendingSubmissionIds = useMemo(
    () =>
      submissions
        .filter((s) => IN_PROGRESS_STATUSES.has(s.status.toLowerCase()))
        .map((s) => s.id),
    [submissions]
  );

  // Poll pending/judging submissions so asynchronous RQ worker verdicts appear automatically.
  useEffect(() => {
    if (!isAuthenticated || pendingSubmissionIds.length === 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      void Promise.all(
        pendingSubmissionIds.map((id) => getSubmission(id).catch(() => null))
      ).then((results) => {
        const updatedById = new Map<number, SubmissionResponse>();
        for (const item of results) {
          if (item) {
            updatedById.set(item.id, item);
          }
        }
        if (updatedById.size > 0) {
          setSubmissions((prev) =>
            prev.map((item) => updatedById.get(item.id) ?? item)
          );
        }
      });
    }, 2000);

    return () => window.clearInterval(timerId);
  }, [isAuthenticated, pendingSubmissionIds]);

  async function handleCodeSubmit(event: FormEvent) {
    event.preventDefault();
    if (!problem) {
      return;
    }

    setSubmitError(null);
    setActionMessage(null);

    if (!code.trim()) {
      setSubmitError("Please enter Python code before submitting.");
      return;
    }

    if (!language.trim()) {
      setSubmitError("Language is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createSubmission({
        problem_id: problem.id,
        code,
        language: language.trim(),
      });
      setSubmissions((prev) => [created, ...prev]);
      setActionMessage(
        `Submission #${created.id} queued (status: ${created.status}). Results update automatically.`
      );
    } catch (err) {
      setSubmitError(getErrorMessage(err, "Failed to submit code."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!problem) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteProblem(problem.id);
      navigate("/problems", { replace: true });
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete problem."));
    } finally {
      setIsDeleting(false);
    }
  }

  function handleTestCaseCreated(created: TestCaseResponse) {
    setActionMessage(`Added test case #${created.id} to problem #${created.problem_id}.`);
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading problem..." />;
  }

  if (loadError || !problem) {
    return (
      <section className="stack-md">
        <Link to="/problems" className="back-link">
          &larr; Back to Problems
        </Link>
        <ErrorBanner
          message={loadError ?? "Problem not found."}
          onRetry={isValidId ? () => void fetchProblemData() : undefined}
        />
      </section>
    );
  }

  return (
    <section className="stack-lg">
      <div>
        <Link to="/problems" className="back-link">
          &larr; Back to Problems
        </Link>
      </div>

      <div className="page-header">
        <div className="title-row">
          <h1>
            #{problem.id} — {problem.title}
          </h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

        {isAuthenticated && (
          <div className="row-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsEditOpen(true)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsTestCaseOpen(true)}
            >
              + Test Case
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                setDeleteError(null);
                setIsDeleteOpen(true);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <p className="muted-text">
          {/* TODO: Backend `Problem` schema currently returns `id`, `title`, and `difficulty` only (no `description` or public test case list). */}
          Write a Python solution reading input from standard input (<code>stdin</code>) and
          printing output to standard output (<code>stdout</code>). Leading and trailing
          whitespace is normalized during judging.
        </p>
      </div>

      {actionMessage && (
        <div className="alert alert-success" role="status">
          <span>{actionMessage}</span>
          <button
            type="button"
            className="btn-icon"
            aria-label="Dismiss notification"
            onClick={() => setActionMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="detail-grid">
        <div className="card stack-md">
          <h2>Submit Solution</h2>

          {!isAuthenticated ? (
            <EmptyState
              title="Sign in to submit"
              description="Authentication is required to submit solutions and view your judging results."
              action={
                <Link to="/login" className="btn btn-primary">
                  Sign in
                </Link>
              }
            />
          ) : (
            <form onSubmit={handleCodeSubmit} className="stack-md" noValidate>
              {submitError && <ErrorBanner message={submitError} />}

              <div className="form-field">
                <label htmlFor="submission-language">Language</label>
                <select
                  id="submission-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="python">python (Python 3.12)</option>
                </select>
                <span className="field-hint">
                  The backend Docker judge currently executes Python solutions.
                </span>
              </div>

              <div className="form-field">
                <label htmlFor="submission-code">Python Code</label>
                <textarea
                  id="submission-code"
                  className="code-textarea"
                  rows={14}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Solution"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="card stack-md">
          <div className="section-header">
            <h2>Your Submissions</h2>
            {isAuthenticated && (
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => void fetchProblemSubmissions()}
                disabled={isLoadingSubmissions}
              >
                Refresh
              </button>
            )}
          </div>

          {!isAuthenticated ? (
            <p className="muted-text">Sign in to view your submissions for this problem.</p>
          ) : isLoadingSubmissions ? (
            <LoadingSpinner label="Loading submissions..." />
          ) : submissionsError ? (
            <ErrorBanner
              message={submissionsError}
              onRetry={() => void fetchProblemSubmissions()}
            />
          ) : submissions.length === 0 ? (
            <EmptyState
              title="No submissions yet"
              description="Submit your Python code on the left to run it against this problem's test cases."
            />
          ) : (
            <div className="stack-sm">
              {submissions.map((sub) => (
                <article key={sub.id} className="submission-item">
                  <div className="submission-item-top">
                    <span className="mono-cell">Submission #{sub.id}</span>
                    <SubmissionStatusBadge status={sub.status} />
                  </div>
                  <div className="submission-meta">
                    <span>
                      Passed: {sub.passed_test_cases} / {sub.total_test_cases}
                    </span>
                    <span>
                      Time:{" "}
                      {sub.execution_time !== null ? `${sub.execution_time}s` : "—"}
                    </span>
                    <span>
                      Memory:{" "}
                      {sub.memory_used !== null ? `${sub.memory_used} MB` : "—"}
                    </span>
                  </div>
                  {sub.error_message && (
                    <pre className="error-pre">{sub.error_message}</pre>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProblemFormModal
        isOpen={isEditOpen}
        mode="edit"
        initialProblem={problem}
        onClose={() => setIsEditOpen(false)}
        onSuccess={(updated) => {
          setProblem(updated);
          setActionMessage(`Updated problem "${updated.title}".`);
        }}
      />

      <TestCaseModal
        isOpen={isTestCaseOpen}
        problemId={problem.id}
        problemTitle={problem.title}
        onClose={() => setIsTestCaseOpen(false)}
        onSuccess={handleTestCaseCreated}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Problem"
        message={`Are you sure you want to delete "${problem.title}" (ID #${problem.id})? This action cannot be undone.`}
        confirmLabel="Delete Problem"
        isSubmitting={isDeleting}
        error={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setIsDeleteOpen(false);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </section>
  );
}

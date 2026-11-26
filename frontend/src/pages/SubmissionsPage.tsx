import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage, getSubmission, listSubmissions } from "../api";
import {
  EmptyState,
  ErrorBanner,
  LoadingSpinner,
  Modal,
  SubmissionStatusBadge,
  TableSkeleton,
} from "../components";
import type { SubmissionResponse } from "../types";

const IN_PROGRESS_STATUSES = new Set(["pending", "judging"]);

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listSubmissions(signal);
      setSubmissions([...data].sort((a, b) => b.id - a.id));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(getErrorMessage(err, "Failed to load submissions."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchSubmissions(controller.signal);
    return () => controller.abort();
  }, [fetchSubmissions]);

  const hasPending = useMemo(
    () => submissions.some((s) => IN_PROGRESS_STATUSES.has(s.status.toLowerCase())),
    [submissions]
  );

  // Poll while any submission is still pending or judging.
  useEffect(() => {
    if (!hasPending) {
      return;
    }

    const timerId = window.setInterval(() => {
      void listSubmissions()
        .then((data) => {
          const sorted = [...data].sort((a, b) => b.id - a.id);
          setSubmissions(sorted);
          setSelectedSubmission((current) =>
            current ? sorted.find((s) => s.id === current.id) ?? current : null
          );
        })
        .catch(() => {
          // Keep existing state during transient polling errors.
        });
    }, 3000);

    return () => window.clearInterval(timerId);
  }, [hasPending]);

  async function handleInspectSubmission(submission: SubmissionResponse) {
    setSelectedSubmission(submission);
    setDetailError(null);
    setIsLoadingDetail(true);
    try {
      const fresh = await getSubmission(submission.id);
      setSelectedSubmission(fresh);
    } catch (err) {
      setDetailError(getErrorMessage(err, "Failed to refresh submission details."));
    } finally {
      setIsLoadingDetail(false);
    }
  }

  return (
    <section className="stack-lg">
      <div className="page-header">
        <div>
          <h1>My Submissions</h1>
          <p className="muted-text">
            View your submitted solutions and asynchronous judging verdicts.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => void fetchSubmissions()}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : error ? (
        <ErrorBanner message={error} onRetry={() => void fetchSubmissions()} />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="Open a problem and submit a Python solution to see your judging results here."
          action={
            <Link to="/problems" className="btn btn-primary">
              Browse Problems
            </Link>
          }
        />
      ) : (
        <div className="table-wrapper card">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Problem</th>
                <th scope="col">Language</th>
                <th scope="col">Status</th>
                <th scope="col">Test Cases</th>
                <th scope="col">Time</th>
                <th scope="col">Memory</th>
                <th scope="col">Submitted</th>
                <th scope="col" className="text-right">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="mono-cell">#{sub.id}</td>
                  <td>
                    <Link to={`/problems/${sub.problem_id}`} className="table-link">
                      Problem #{sub.problem_id}
                    </Link>
                  </td>
                  <td className="mono-cell">{sub.language}</td>
                  <td>
                    <SubmissionStatusBadge status={sub.status} />
                  </td>
                  <td>
                    {sub.passed_test_cases} / {sub.total_test_cases}
                  </td>
                  <td>
                    {sub.execution_time !== null ? `${sub.execution_time}s` : "—"}
                  </td>
                  <td>{sub.memory_used !== null ? `${sub.memory_used} MB` : "—"}</td>
                  <td>{formatDateTime(sub.created_at)}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => void handleInspectSubmission(sub)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedSubmission)}
        title={
          selectedSubmission ? `Submission #${selectedSubmission.id}` : "Submission"
        }
        onClose={() => setSelectedSubmission(null)}
      >
        {selectedSubmission && (
          <div className="stack-md">
            {isLoadingDetail && <LoadingSpinner label="Refreshing details..." />}
            {detailError && <ErrorBanner message={detailError} />}

            <div className="detail-meta-grid">
              <div>
                <span className="meta-label">Status</span>
                <div>
                  <SubmissionStatusBadge status={selectedSubmission.status} />
                </div>
              </div>
              <div>
                <span className="meta-label">Problem</span>
                <div>
                  <Link
                    to={`/problems/${selectedSubmission.problem_id}`}
                    className="table-link"
                    onClick={() => setSelectedSubmission(null)}
                  >
                    Problem #{selectedSubmission.problem_id}
                  </Link>
                </div>
              </div>
              <div>
                <span className="meta-label">Passed Test Cases</span>
                <div>
                  {selectedSubmission.passed_test_cases} /{" "}
                  {selectedSubmission.total_test_cases}
                </div>
              </div>
              <div>
                <span className="meta-label">Execution Time</span>
                <div>
                  {selectedSubmission.execution_time !== null
                    ? `${selectedSubmission.execution_time}s`
                    : "—"}
                </div>
              </div>
              <div>
                <span className="meta-label">Memory Used</span>
                <div>
                  {selectedSubmission.memory_used !== null
                    ? `${selectedSubmission.memory_used} MB`
                    : "—"}
                </div>
              </div>
              <div>
                <span className="meta-label">Language</span>
                <div className="mono-cell">{selectedSubmission.language}</div>
              </div>
            </div>

            {selectedSubmission.error_message && (
              <div className="stack-xs">
                <span className="meta-label">Error Message</span>
                <pre className="error-pre">{selectedSubmission.error_message}</pre>
              </div>
            )}

            <div className="stack-xs">
              <span className="meta-label">Submitted Code</span>
              <pre className="code-pre">{selectedSubmission.code}</pre>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

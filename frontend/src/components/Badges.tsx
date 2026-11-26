export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const normalized = difficulty.trim().toLowerCase();
  let variant = "badge-neutral";
  if (normalized === "easy") {
    variant = "badge-success";
  } else if (normalized === "medium") {
    variant = "badge-warning";
  } else if (normalized === "hard") {
    variant = "badge-danger";
  }

  return <span className={`badge ${variant}`}>{difficulty}</span>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  judging: "Judging...",
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  runtime_error: "Runtime Error",
  time_limit_exceeded: "Time Limit Exceeded",
  no_test_cases: "No Test Cases",
  judge_error: "Judge Error",
};

export function SubmissionStatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase();
  let variant = "badge-neutral";

  if (normalized === "accepted") {
    variant = "badge-success";
  } else if (normalized === "pending" || normalized === "judging") {
    variant = "badge-info";
  } else if (normalized === "no_test_cases") {
    variant = "badge-warning";
  } else if (
    normalized === "wrong_answer" ||
    normalized === "runtime_error" ||
    normalized === "time_limit_exceeded" ||
    normalized === "judge_error"
  ) {
    variant = "badge-danger";
  }

  const label = STATUS_LABELS[normalized] ?? status;

  return <span className={`badge ${variant}`}>{label}</span>;
}

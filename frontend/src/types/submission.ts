/**
 * Known status values observed in `app/models/submissionDB.py`,
 * `app/workers/judge_worker.py`, `app/services/judge_service.py`,
 * and `app/services/code_executor.py`.
 */
export type KnownSubmissionStatus =
  | "pending"
  | "judging"
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "time_limit_exceeded"
  | "no_test_cases"
  | "judge_error";

/** Matches backend schema `SubmissionCreate` in `app/schemas/submissions.py`. */
export interface SubmissionCreate {
  problem_id: number;
  code: string;
  language: string;
}

/** Matches backend schema `SubmissionResponse` in `app/schemas/submissions.py`. */
export interface SubmissionResponse {
  id: number;
  user_id: number;
  problem_id: number;
  code: string;
  language: string;
  status: KnownSubmissionStatus | (string & {});
  execution_time: number | null;
  memory_used: number | null;
  error_message: string | null;
  created_at: string;
  passed_test_cases: number;
  total_test_cases: number;
}

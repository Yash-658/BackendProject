/** Matches backend schema `TestCaseCreate` in `app/schemas/testCases.py`. */
export interface TestCaseCreate {
  input_data: string;
  expected_output: string;
}

/** Matches backend schema `TestCaseResponse` in `app/schemas/testCases.py`. */
export interface TestCaseResponse {
  id: number;
  problem_id: number;
  input_data: string;
  expected_output: string;
}

/**
 * Matches backend schema `Problem` in `app/schemas/problems.py`.
 * TODO: Backend `Problem` response currently only includes `id`, `title`, and `difficulty`
 * (no `description` or `test_cases` read endpoint exists yet).
 */
export interface Problem {
  id: number;
  title: string;
  difficulty: string;
}

/** Matches backend schema `ProblemCreate` in `app/schemas/problems.py`. */
export interface ProblemCreate {
  title: string;
  difficulty: string;
  test_cases: TestCaseCreate[];
}

/** Matches backend schema `ProblemUpdate` in `app/schemas/problems.py`. */
export interface ProblemUpdate {
  title?: string | null;
  difficulty?: string | null;
}

import type {
  Problem,
  ProblemCreate,
  ProblemUpdate,
  TestCaseCreate,
  TestCaseResponse,
} from "../types";
import { apiRequest } from "./client";

export function listProblems(signal?: AbortSignal): Promise<Problem[]> {
  return apiRequest<Problem[]>("/problems", { signal });
}

export function getProblem(problemId: number, signal?: AbortSignal): Promise<Problem> {
  return apiRequest<Problem>(`/problems/${problemId}`, { signal });
}

export function createProblem(payload: ProblemCreate): Promise<Problem> {
  return apiRequest<Problem>("/problems", {
    method: "POST",
    json: payload,
    auth: true,
  });
}

export function updateProblem(problemId: number, payload: ProblemUpdate): Promise<Problem> {
  return apiRequest<Problem>(`/problems/${problemId}`, {
    method: "PATCH",
    json: payload,
    auth: true,
  });
}

export function deleteProblem(problemId: number): Promise<void> {
  return apiRequest<void>(`/problems/${problemId}`, {
    method: "DELETE",
    auth: true,
  });
}

export function addTestCase(
  problemId: number,
  payload: TestCaseCreate
): Promise<TestCaseResponse> {
  return apiRequest<TestCaseResponse>(`/problems/${problemId}/test_cases`, {
    method: "POST",
    json: payload,
    auth: true,
  });
}

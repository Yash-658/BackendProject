import type { SubmissionCreate, SubmissionResponse } from "../types";
import { apiRequest } from "./client";

export function createSubmission(payload: SubmissionCreate): Promise<SubmissionResponse> {
  return apiRequest<SubmissionResponse>("/submissions", {
    method: "POST",
    json: payload,
    auth: true,
  });
}

export function listSubmissions(signal?: AbortSignal): Promise<SubmissionResponse[]> {
  return apiRequest<SubmissionResponse[]>("/submissions", {
    auth: true,
    signal,
  });
}

export function getSubmission(
  submissionId: number,
  signal?: AbortSignal
): Promise<SubmissionResponse> {
  return apiRequest<SubmissionResponse>(`/submissions/${submissionId}`, {
    auth: true,
    signal,
  });
}

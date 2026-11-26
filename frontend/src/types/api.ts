/** FastAPI validation error item returned on HTTP 422 responses. */
export interface FastApiValidationErrorItem {
  loc: Array<string | number>;
  msg: string;
  type: string;
}

/** Standard FastAPI error body (`detail` can be a message or 422 validation list). */
export interface FastApiErrorBody {
  detail?: string | FastApiValidationErrorItem[];
}

export interface HealthResponse {
  message: string;
}

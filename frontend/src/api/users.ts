import type { UserResponse } from "../types";
import { apiRequest } from "./client";

/**
 * Fetches users via `GET /users` (requires authentication).
 */
export function listUsers(signal?: AbortSignal): Promise<UserResponse[]> {
  return apiRequest<UserResponse[]>("/users", {
    auth: true,
    signal,
  });
}

import type { FastApiErrorBody } from "../types";

const TOKEN_STORAGE_KEY = "coding_platform_access_token";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly isNetworkError: boolean;
  readonly details?: unknown;

  constructor(
    status: number,
    message: string,
    isNetworkError = false,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isNetworkError = isNetworkError;
    this.details = details;
  }
}

type UnauthorizedListener = () => void;

let unauthorizedListener: UnauthorizedListener | null = null;

export function setUnauthorizedHandler(listener: UnauthorizedListener | null): void {
  unauthorizedListener = listener;
}

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage write errors in restricted browsing contexts.
  }
}

export function clearStoredToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage removal errors in restricted browsing contexts.
  }
}

export interface JwtClaims {
  sub?: string;
  exp?: number;
}

/**
 * Safely decodes the JWT payload without verifying signature (client-side display only).
 * Returns null if the token is malformed.
 */
export function decodeJwtClaims(token: string): JwtClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    return {
      sub: typeof record.sub === "string" ? record.sub : undefined,
      exp: typeof record.exp === "number" ? record.exp : undefined,
    };
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const claims = decodeJwtClaims(token);
  if (!claims?.exp) {
    return false;
  }
  return Date.now() >= claims.exp * 1000;
}

function extractErrorMessage(parsed: unknown, fallbackStatus: number, rawText: string): string {
  if (typeof parsed === "object" && parsed !== null) {
    const body = parsed as FastApiErrorBody;
    if (typeof body.detail === "string" && body.detail.trim()) {
      return body.detail;
    }
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      return body.detail
        .map((item) => {
          const field = item.loc.slice(1).join(".") || item.loc.join(".");
          return field ? `${field}: ${item.msg}` : item.msg;
        })
        .join("; ");
    }
  }

  if (rawText.trim()) {
    return rawText.trim().slice(0, 200);
  }

  return `Request failed with status ${fallbackStatus}`;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: BodyInit | null;
  json?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  skipUnauthorizedHandler?: boolean;
  signal?: AbortSignal;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    json,
    headers = {},
    auth = false,
    skipUnauthorizedHandler = false,
    signal,
  } = options;

  const requestHeaders = new Headers(headers);

  let requestBody: BodyInit | undefined = body ?? undefined;
  if (json !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(json);
  }

  if (auth) {
    const token = getStoredToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      0,
      "Network error: unable to reach the backend API. Ensure the FastAPI server is running.",
      true
    );
  }

  // Handle 204 No Content and empty responses cleanly.
  if (response.status === 204) {
    return undefined as T;
  }

  let rawText = "";
  try {
    rawText = await response.text();
  } catch {
    throw new ApiError(response.status, "Failed to read response body from server.");
  }

  let parsed: unknown = null;
  if (rawText.trim().length > 0) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      if (response.ok) {
        throw new ApiError(
          response.status,
          "Received a malformed JSON response from the server."
        );
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !skipUnauthorizedHandler) {
      clearStoredToken();
      unauthorizedListener?.();
    }

    const message = extractErrorMessage(parsed, response.status, rawText);
    throw new ApiError(response.status, message, false, parsed);
  }

  if (rawText.trim().length === 0) {
    throw new ApiError(
      response.status,
      "Server returned an empty response body where JSON was expected."
    );
  }

  return parsed as T;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

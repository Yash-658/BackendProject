import type { LoginCredentials, TokenResponse, UserCreate, UserResponse } from "../types";
import { apiRequest } from "./client";

/**
 * Registers a new user account via `POST /users`.
 */
export function registerUser(payload: UserCreate): Promise<UserResponse> {
  return apiRequest<UserResponse>("/users", {
    method: "POST",
    json: payload,
  });
}

/**
 * Authenticates via FastAPI `OAuth2PasswordRequestForm` (`POST /users/login`).
 * Sends `application/x-www-form-urlencoded` with `username` and `password`.
 */
export function loginUser(credentials: LoginCredentials): Promise<TokenResponse> {
  const formData = new URLSearchParams();
  formData.set("username", credentials.username);
  formData.set("password", credentials.password);

  return apiRequest<TokenResponse>("/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
    skipUnauthorizedHandler: true,
  });
}

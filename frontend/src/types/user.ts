/** Matches backend schema `UserCreate` in `app/schemas/users.py`. */
export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

/**
 * Matches backend schema `UserResponse` in `app/schemas/users.py`.
 * TODO: Backend `UserDB` has a `role` column ("user" | "admin"), but `UserResponse`
 * does not currently expose `role` and there is no `/users/me` endpoint.
 */
export interface UserResponse {
  id: number;
  username: string;
  email: string;
}

/** Matches backend `OAuth2PasswordRequestForm` fields for `POST /users/login`. */
export interface LoginCredentials {
  username: string;
  password: string;
}

/** Matches backend schema `TokenResponse` in `app/schemas/users.py`. */
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export type AuthProvider = "password" | "sso" | "oauth";

export type LoginRequest = {
  username: string;
  password: string;
  provider?: AuthProvider;
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  groups: string[];
  is_salesperson: boolean;
  permissions: string[];
};

export type LoginResponse = UserProfile & {
  token: string;
};

export type LogoutRequest = {
  token: string;
};

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_LOCKED"
  | "TOKEN_EXPIRED"
  | "UNAUTHORIZED"
  | "MFA_REQUIRED"
  | "RATE_LIMITED"
  | "UNKNOWN";

export type ApiError = {
  code: AuthErrorCode;
  message: string;
  traceId?: string;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiRequest = {
  method: HttpMethod;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export type ApiTransport = <T>(request: ApiRequest) => Promise<ApiResult<T>>;

export type AuthEndpoints = {
  login: "/auth/login/";
  logout: "/auth/logout/";
  currentUser: "/auth/user/";
};

export const AUTH_ENDPOINTS: AuthEndpoints = {
  login: "/auth/login/",
  logout: "/auth/logout/",
  currentUser: "/auth/user/"
};

export interface AuthApi {
  login(request: LoginRequest): Promise<ApiResult<LoginResponse>>;
  logout(request: LogoutRequest): Promise<ApiResult<{ message: string }>>;
  currentUser(token: string): Promise<ApiResult<UserProfile>>;
}

export const createAuthApi = (transport: ApiTransport): AuthApi => ({
  login: (request) =>
    transport<LoginResponse>({
      method: "POST",
      path: AUTH_ENDPOINTS.login,
      body: request
    }),
  logout: (request) =>
    transport<{ message: string }>({
      method: "POST",
      path: AUTH_ENDPOINTS.logout,
      headers: {
        Authorization: `Token ${request.token}`
      }
    }),
  currentUser: (token) =>
    transport<UserProfile>({
      method: "GET",
      path: AUTH_ENDPOINTS.currentUser,
      headers: {
        Authorization: `Token ${token}`
      }
    })
});

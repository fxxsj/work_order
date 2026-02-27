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

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

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

export type WorkOrderListItem = {
  id: number;
  order_number: string;
  customer_name: string | null;
  salesperson_name: string | null;
  product_name: string | null;
  quantity: number;
  unit: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  order_date: string | null;
  delivery_date: string | null;
  total_amount: string | number | null;
  progress_percentage: number;
  approval_status: string;
  approval_status_display: string;
  draft_task_count: number;
  total_task_count: number;
};

export type WorkOrderListParams = {
  page?: number;
  search?: string;
  status?: string;
};

export interface WorkOrderApi {
  list(token: string, params?: WorkOrderListParams): Promise<ApiResult<PaginatedResponse<WorkOrderListItem>>>;
}

const buildQuery = (params?: Record<string, string | number | undefined>): string => {
  if (!params) {
    return "";
  }
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== "");
  if (entries.length === 0) {
    return "";
  }
  const query = entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join("&");
  return `?${query}`;
};

export const createWorkOrderApi = (transport: ApiTransport): WorkOrderApi => ({
  list: (token, params) =>
    transport<PaginatedResponse<WorkOrderListItem>>({
      method: "GET",
      path: `/workorders/${buildQuery(params)}`,
      headers: {
        Authorization: `Token ${token}`
      }
    })
});

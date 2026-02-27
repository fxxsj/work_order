import type { ApiRequest, ApiResult, AuthErrorCode } from "@work-order/core-api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

const toErrorCode = (status: number): AuthErrorCode => {
  if (status === 401) {
    return "UNAUTHORIZED";
  }
  if (status === 429) {
    return "RATE_LIMITED";
  }
  if (status >= 400 && status < 500) {
    return "INVALID_CREDENTIALS";
  }
  return "UNKNOWN";
};

export const apiTransport = async <T>(request: ApiRequest): Promise<ApiResult<T>> => {
  const url = `${API_BASE_URL}${request.path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(request.headers ?? {})
  };

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: request.body ? JSON.stringify(request.body) : undefined
    });

    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
      const message = data?.message ?? data?.error ?? response.statusText;
      return {
        ok: false,
        error: {
          code: toErrorCode(response.status),
          message
        }
      };
    }

    return {
      ok: true,
      data: data as T
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "UNKNOWN",
        message: error instanceof Error ? error.message : "Network error"
      }
    };
  }
};

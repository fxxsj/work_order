import type { LoginResponse, UserProfile } from "@work-order/core-api";

export type AuthState = {
  token: string | null;
  user: UserProfile | null;
  lastLoginAt: number | null;
};

export type AuthActions = {
  setSession(payload: LoginResponse): void;
  clearSession(): void;
  hydrate(payload: AuthState): void;
};

export type AuthStore = {
  state: AuthState;
  actions: AuthActions;
};

export type AuthStorageAdapter = {
  load(): Promise<AuthState | null>;
  save(state: AuthState): Promise<void>;
  clear(): Promise<void>;
};

export const createAuthState = (): AuthState => ({
  token: null,
  user: null,
  lastLoginAt: null
});

export const createAuthStore = (
  initialState: AuthState = createAuthState(),
  storage?: AuthStorageAdapter
): AuthStore => {
  const state: AuthState = { ...initialState };

  const setSession = (payload: LoginResponse): void => {
    state.token = payload.token;
    state.user = {
      id: payload.id,
      username: payload.username,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      is_staff: payload.is_staff,
      is_superuser: payload.is_superuser,
      groups: payload.groups,
      is_salesperson: payload.is_salesperson,
      permissions: payload.permissions
    };
    state.lastLoginAt = Date.now();
    storage?.save({ ...state });
  };

  const clearSession = (): void => {
    state.token = null;
    state.user = null;
    state.lastLoginAt = null;
    storage?.clear();
  };

  const hydrate = (payload: AuthState): void => {
    state.token = payload.token;
    state.user = payload.user;
    state.lastLoginAt = payload.lastLoginAt;
  };

  return {
    state,
    actions: {
      setSession,
      clearSession,
      hydrate
    }
  };
};

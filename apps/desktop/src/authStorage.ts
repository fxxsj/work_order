import type { AuthState, AuthStorageAdapter } from "@work-order/core-store";

const STORAGE_KEY = "work-order-desktop-auth";

const safeParse = (value: string | null): AuthState | null => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as AuthState;
  } catch {
    return null;
  }
};

export const createSessionStorageAdapter = (): AuthStorageAdapter => ({
  load: async () => safeParse(sessionStorage.getItem(STORAGE_KEY)),
  save: async (state) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  clear: async () => {
    sessionStorage.removeItem(STORAGE_KEY);
  }
});

import { reactive } from "vue";
import { createAuthState, createAuthStore } from "@work-order/core-store";
import { createSessionStorageAdapter } from "./authStorage";

const storage = createSessionStorageAdapter();
const state = reactive(createAuthState());
const store = createAuthStore(undefined, storage, state);

let hydrated = false;

export const authStore = store;
export const authState = state;

export const hydrateAuth = async (): Promise<void> => {
  if (hydrated) {
    return;
  }
  const cached = await storage.load();
  if (cached?.token) {
    store.actions.hydrate(cached);
  }
  hydrated = true;
};

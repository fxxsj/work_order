import type { App } from "vue";
import PermissionGate from "./PermissionGate.vue";

export { PermissionGate };

export const registerGlobalComponents = (app: App): void => {
  app.component("PermissionGate", PermissionGate);
};

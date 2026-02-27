import type { App, DirectiveBinding } from "vue";
import { authState } from "../authStore";
import { hasPermission } from "../permissions";

type PermissionValue = string | string[] | { anyOf?: string[]; allOf?: string[] };

const resolvePermissions = (value: PermissionValue): { mode: "any" | "all"; permissions: string[] } => {
  if (typeof value === "string") {
    return { mode: "all", permissions: [value] };
  }
  if (Array.isArray(value)) {
    return { mode: "all", permissions: value };
  }
  if (value?.anyOf && value.anyOf.length > 0) {
    return { mode: "any", permissions: value.anyOf };
  }
  return { mode: "all", permissions: value?.allOf ?? [] };
};

const applyPermission = (el: HTMLElement, value: PermissionValue) => {
  const { mode, permissions } = resolvePermissions(value);
  if (permissions.length === 0) {
    return;
  }
  const allowed =
    mode === "any"
      ? permissions.some((perm) => hasPermission(authState.user, [perm]))
      : hasPermission(authState.user, permissions);
  if (!allowed) {
    el.setAttribute("disabled", "true");
    el.setAttribute("aria-disabled", "true");
    el.style.pointerEvents = "none";
    el.style.opacity = "0.5";
  }
};

export const permissionDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    applyPermission(el, binding.value);
  },
  updated(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    applyPermission(el, binding.value);
  }
};

export const registerPermissionDirective = (app: App): void => {
  app.directive("permission", permissionDirective);
};

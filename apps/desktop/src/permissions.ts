import type { UserProfile } from "@work-order/core-api";

export const hasPermission = (user: UserProfile | null, required: string[]): boolean => {
  if (!user) {
    return false;
  }
  if (user.permissions?.includes("*")) {
    return true;
  }
  return required.every((perm) => user.permissions?.includes(perm));
};

<template>
  <slot v-if="allowed" />
  <slot v-else name="fallback" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { UserProfile } from "@work-order/core-api";
import { authState } from "../authStore";
import { hasPermission } from "../permissions";

type Mode = "all" | "any";

const props = withDefaults(
  defineProps<{
    permissions: string[];
    mode?: Mode;
    user?: UserProfile | null;
  }>(),
  {
    mode: "all",
    user: null
  }
);

const allowed = computed(() => {
  const user = props.user ?? authState.user;
  if (!props.permissions || props.permissions.length === 0) {
    return true;
  }
  if (props.mode === "any") {
    return props.permissions.some((perm) => hasPermission(user, [perm]));
  }
  return hasPermission(user, props.permissions);
});
</script>

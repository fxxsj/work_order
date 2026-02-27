import { defineComponent, h } from "vue";

export type ButtonVariant = "primary" | "ghost" | "danger";

export const BaseButton = defineComponent({
  name: "BaseButton",
  props: {
    variant: {
      type: String as () => ButtonVariant,
      default: "primary"
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { slots, attrs }) {
    const styles: Record<ButtonVariant, Record<string, string>> = {
      primary: {
        background: "#1f2a44",
        color: "#fff",
        border: "none"
      },
      ghost: {
        background: "transparent",
        color: "#1f2a44",
        border: "1px solid #1f2a44"
      },
      danger: {
        background: "#b42318",
        color: "#fff",
        border: "none"
      }
    };

    return () =>
      h(
        "button",
        {
          ...attrs,
          type: (attrs as { type?: string }).type ?? "button",
          disabled: props.disabled,
          style: {
            padding: "10px 14px",
            borderRadius: "10px",
            fontWeight: "600",
            cursor: props.disabled ? "not-allowed" : "pointer",
            opacity: props.disabled ? "0.6" : "1",
            transition: "opacity 0.2s ease",
            ...styles[props.variant]
          }
        },
        slots.default ? slots.default() : "Button"
      );
  }
});

const path = require("node:path");
const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const vuePlugin = require("eslint-plugin-vue");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended
});

module.exports = [
  ...compat.extends("./infra/eslint-config/index.js"),
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/src-tauri/**"
    ]
  },
  {
    files: ["**/*.vue"],
    plugins: {
      vue: vuePlugin
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "vue/no-unused-components": "error",
      "vue/no-unused-vars": "error"
    }
  }
];

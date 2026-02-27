const path = require("node:path");
const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const vuePlugin = require("eslint-plugin-vue");
const tsParser = require("@typescript-eslint/parser");
const espree = require("espree");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended
});

module.exports = [
  ...compat.extends("./infra/eslint-config/index.js"),
  ...vuePlugin.configs["flat/recommended"],
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
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        parser: {
          ts: tsParser,
          js: espree
        }
      }
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "vue/valid-v-for": "off"
    }
  }
];

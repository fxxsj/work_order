module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true,
    browser: true
  },
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  rules: {
    "no-console": "error"
  }
};

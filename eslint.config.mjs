import prettierConfig from "eslint-config-prettier";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        Phaser: "readonly", //damit es keine "Phaser is not defind" gibt bzw. ESLint nicht wegen Phaser meckert
        window: "readonly",
        document: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
    },
  },
  prettierConfig,
];

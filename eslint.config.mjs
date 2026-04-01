import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.node, // ✅ FIXED (use node instead of browser)
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      // 🚨 CRITICAL (must have)
      "no-undef": "error",
      "no-unreachable": "error",
      "no-redeclare": "error",
    
      // ⚠️ VERY IMPORTANT
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-empty": "warn",
    
      // ⚡ Async safety (super important for Discord.js)
      // "require-await": "warn",
      "no-async-promise-executor": "error",
    
      // 🧹 Clean & safe code
      "eqeqeq": "error",
      "prefer-const": "warn",
      "no-var": "error",
    
      // 🛑 Prevent dumb mistakes
      "no-debugger": "error"
    }
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs"
    }
  }
]);
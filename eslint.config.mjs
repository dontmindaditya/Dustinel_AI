import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore backend and test files to reduce noise
    "src/**",
    "tests/**",
  ]),
  // Relax some strict rules that cause many warnings
  {
    rules: {
      // Allow 'any' type for flexibility in this project
      "@typescript-eslint/no-explicit-any": "off",
      // Allow empty interfaces (common for type extensions)
      "@typescript-eslint/no-empty-object-type": "off",
      // Allow namespaces (needed for Express request extension)
      "@typescript-eslint/no-namespace": "off",
      // Allow unused vars warnings only (not errors)
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow img element (for simple cases)
      "@next/next/no-img-element": "warn",
      // Allow html link for pages (needed for some redirects)
      "@next/next/no-html-link-for-pages": "off",
      // Allow unescaped entities in some cases
      "react/no-unescaped-entities": "warn",
    },
  },
]);

export default eslintConfig;

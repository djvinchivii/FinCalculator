import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".next-dev/**",
      "out/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];

export default eslintConfig;

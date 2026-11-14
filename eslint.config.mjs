import next from "eslint-config-next";
import nextTypeScript from "eslint-config-next/typescript";

/**
 * Flat ESLint configuration (ESLint 9 / Next.js 16).
 * `next lint` was removed in Next 16, so `npm run lint` calls ESLint directly.
 */
export default [
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      // `wrangler dev`/`deploy` write their bundled output here; linting it
      // produced thousands of errors from generated code.
      "tmp/**",
      ".dryrun/**",
      "node_modules/**",
      "out/**",
      "next-env.d.ts",
      ".audit*.json",
    ],
  },
  ...next,
  ...nextTypeScript,
  {
    // Module boundaries (micro-frontend style): a feature is addressable only
    // through its public barrel. Reaching into `components/`, `context/` or
    // `hooks/` of another feature is a contract violation and fails lint.
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/features/*/components/*",
                "@/features/*/context/*",
                "@/features/*/hooks/*",
              ],
              message:
                "Import through the feature barrel instead: `@/features/<name>`.",
            },
          ],
        },
      ],
    },
  },
  {
    rules: {
      // Existing UI code uses `any` in a few places; surface it as a warning
      // instead of failing the build while the codebase is migrated.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react/no-unescaped-entities": "off",
      // Pre-existing screens hydrate local state inside effects (data fetching).
      // Kept as a warning so the rule stays visible without a UI refactor.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

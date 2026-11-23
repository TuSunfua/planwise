import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const RELATIVE = { regex: "^\\.{1,2}(/|$)", message: "Import absolutely, from @/…" };
const DATABASE = { regex: "^(pg|drizzle-orm)(/|$)", message: "Only db/ and lib/ talk to the database." };
const layer = (folders) => ({ regex: `^@/(${folders})(/|$)`, message: "Wrong layer: see code-conventions.md §2." });
const imports = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns: [RELATIVE, ...patterns] }],
});

const PALETTE =
  "(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-[0-9]|black|white";
const SYNTAX = [
  { selector: "ExportAllDeclaration", message: "No barrel files." },
  {
    selector: "ExportNamedDeclaration[source=null][specifiers.length>0]",
    message: "Export where it is declared: export function, export const.",
  },
  {
    selector: `Literal[value=/(^|[ :])(bg|text|border|ring|outline|fill|stroke)-(${PALETTE}|\\[#)/]`,
    message: "Use a semantic token from docs/brand/theme.md.",
  },
  {
    selector: "MemberExpression[object.name='process'][property.name='env']",
    message: "Read configuration through lib/config.ts.",
  },
];

export default defineConfig([
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  { linterOptions: { noInlineConfig: true } },
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    rules: {
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal"],
          pathGroups: [{ pattern: "@/**", group: "internal" }],
          pathGroupsExcludedImportTypes: ["builtin"],
          alphabetize: { order: "asc" },
          "newlines-between": "always",
        },
      ],
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "no-console": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "object-shorthand": "error",
      "prefer-template": "error",
      "react/function-component-definition": [
        "error",
        { namedComponents: "function-declaration", unnamedComponents: "arrow-function" },
      ],
      "no-restricted-syntax": ["error", ...SYNTAX],
      ...imports(),
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-expect-error": true }],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "separate-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", enableAutofixRemoval: { imports: true } },
      ],
      // A promise nobody awaits can be cut off when the response ends.
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
    },
  },

  // A later block replaces an earlier one's list.
  { files: ["src/app/**"], rules: imports(DATABASE, layer("db")) },
  { files: ["src/components/**", "src/app/**/_components/**"], rules: imports(DATABASE, layer("data|db")) },
  {
    files: ["src/data/**"],
    rules: {
      ...imports(DATABASE, layer("app|components|db/schema")),
      "no-restricted-syntax": [
        "error",
        ...SYNTAX,
        { selector: "Program:not([body.0.source.value='server-only'])", message: 'Start with import "server-only".' },
      ],
    },
  },
  { files: ["src/db/**"], rules: imports(layer("app|components|data")) },
  { files: ["src/lib/**"], rules: imports(layer("app|components")) },
  {
    files: ["src/lib/config.ts", "*.config.{ts,mjs}", "tests/**"],
    rules: {
      "no-restricted-syntax": ["error", ...SYNTAX.filter((rule) => !rule.selector.startsWith("MemberExpression"))],
    },
  },
  { files: ["src/lib/logging.ts", "src/lib/email.ts"], rules: { "no-console": "off" } },
]);

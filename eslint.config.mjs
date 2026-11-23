import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Only plugins that eslint-config-next already ships.

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
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", enableAutofixRemoval: { imports: true } },
      ],
      // A promise nobody awaits is dropped when the Worker's response ends.
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
    },
  },

  // Layers (code-conventions.md §2). A later block replaces an earlier one's list.
  { files: ["app/**"], rules: imports(DATABASE, layer("db|workers")) },
  { files: ["components/**", "app/**/_components/**"], rules: imports(DATABASE, layer("data|db|workers")) },
  {
    files: ["data/**"],
    rules: {
      ...imports(DATABASE, layer("app|components|workers|db/schema")),
      "no-restricted-syntax": [
        "error",
        ...SYNTAX,
        { selector: "Program:not([body.0.source.value='server-only'])", message: 'Start with import "server-only".' },
      ],
    },
  },
  { files: ["db/**"], rules: imports(layer("app|components|data")) },
  { files: ["lib/**"], rules: imports(layer("app|components")) },
  { files: ["workers/**"], rules: imports(layer("app|components|data")) },
  {
    files: ["lib/config.ts", "*.config.{ts,mjs}", "tests/**"],
    rules: {
      "no-restricted-syntax": ["error", ...SYNTAX.filter((rule) => !rule.selector.startsWith("MemberExpression"))],
    },
  },
  { files: ["lib/logging.ts", "lib/email.ts"], rules: { "no-console": "off" } },
]);

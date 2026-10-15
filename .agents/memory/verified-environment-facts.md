---
description: AST and tooling facts checked against Oxlint 1.87, ESLint 9.39, typescript-eslint 8.71
---

Checked empirically against Oxlint 1.87 (Vite+ 1.1.0), ESLint 9.39, and
`@typescript-eslint/parser` 8.71:

- Both hosts hand rules a TypeScript-ESTree tree. String literals are node type
  **`Literal`** with a `.value`.
- `TSESTree` node `type`s are a string enum, but comparing one to a string
  literal (`node.type === "Literal"`) type-checks.
- Abstract members are **`TSAbstractMethodDefinition`** and
  **`TSAbstractPropertyDefinition`**, not `MethodDefinition` and
  `PropertyDefinition`. A rule matching one must match both.
- An overload signature or abstract method is a `TSEmptyBodyFunctionExpression`
  under its method node, and interface methods are `TSMethodSignature`. A rule
  walking functions must include both or they slip through.
- `MethodDefinition` needs no visitor of its own: its `value` is visited in its
  own right, so adding one double reports.
- `Property` covers destructuring as well as object literals. Check
  `node.parent.type === "ObjectExpression"` to tell a declared key from a bound
  name.
- `TSParameterProperty` wraps the parameter; the type annotation's parent is
  still the inner `Identifier`, with `optional` populated.
- **`AccessorProperty` type annotations are walked** by both hosts, unlike Deno.
  `accessor a?: T` does not parse under Oxlint.
- Oxlint's parser rejects a required parameter after an optional one, so test
  snippets must be valid TypeScript, not just valid syntax.
- Oxlint's `RuleTester` counts **columns from 0**, ESLint's from 1.
- ESLint's `RuleTester` parses as TypeScript only when given a `.ts` filename
  with `@typescript-eslint/parser`; the harness sets both.
- The type systems do not meet: `@eslint/core`'s `RuleDefinition` is not
  assignable to Oxlint's `Rule` (`meta.docs` lacks an index signature; the
  `sourceCode` shapes differ), and `@typescript-eslint/utils`' `RuleModule` fits
  neither. Oxlint runs ESLint rules unchanged at runtime; the harness bridges the
  types in one documented place.
- Oxlint loads a `.ts` plugin from a relative path directly on Node 24, `#`
  imports and a JSON import of `package.json` included.
- Oxlint and Oxfmt respect `.gitignore`; that is the only reason `dist/` and
  `node_modules/` are not linted.
- A type-level `import("x")` is `TSImportType` with a string `Literal` at
  `.source` under both hosts (typescript-eslint 8 deprecates `.argument`). A
  backtick dynamic import is `ImportExpression` with a `TemplateLiteral`
  source under both.
- Both `RuleTester`s take a per-case absolute `filename`, and
  `context.filename` is then that path under both hosts. A relative name is
  not: ESLint passes it through unchanged, Oxlint joins it onto
  `node_modules/oxlint/`. So `#testing`'s default is `resolve("example.ts")`.
- Vite+ bundles `vite.config.ts` and resolves `#` imports in it.

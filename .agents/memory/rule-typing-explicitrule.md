---
description: Rules use ESLint's create API, typed ExplicitRule, with every visitor node parameter annotated by hand
---

Rules are plain ESLint rules: `meta` plus `create(context)`, never Oxlint's
`createOnce`. Its one `dependencies` entry, `@eslint/core`, is there for
the public types only (see below). A rule is typed
`ExplicitRule` from `#helpers`: `@eslint/core`'s `RuleDefinition`, with
`TSESTree` nodes from `@typescript-eslint/types`, so `context.report` takes
TypeScript nodes. The `Explicit*` names come from the template repo,
eslint-plugin-explicit-types: `scripts/project-lint-types.ts` builds on
`ExplicitRuleTypes` and `ExplicitSourceCode`, so the names stay. The only
runtime import is `node:fs`, which reads `package.json`.

ESLint's visitor type is loose, so every visitor annotates its node parameter
(`TSTypeOperator(node: TSESTree.TSTypeOperator): void`). Forget one and the
parameter is `any`; the type-aware `typescript/no-unsafe-*` rules in
`vite.config.ts` then fail. Verified by removing an annotation.

Why not the alternatives, all checked:

- `@typescript-eslint/utils`' `RuleModule` is assignable to neither ESLint's
  `RuleDefinition` nor Oxlint's `Rule` (its catch-all listener is
  `RuleFunction<never>`).
- Oxlint's `Rule` type would make the package depend on `@oxlint/plugins`.

The public `dist/index.d.ts` imports `ConfigObject` and `Plugin` from
`@eslint/core`, so it is the one entry in `dependencies` (types only, as in
the template); there is no `pack.deps` setting in `vite.config.ts`.

Messages are one ESLint-style sentence. ESLint and Oxlint diagnostics have no
hint field, so Deno's hints moved to the rule docs, or into a suggestion's
message where a suggestion exists. Report with `messageId` and `data`
so tests can assert which message fired. See [[plugin-dual-ruletester]] and [[plugin-messages-and-fixes]].

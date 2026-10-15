---
description: Rules use ESLint's create API, typed ExplicitRule, with every visitor node parameter annotated by hand
---

Rules are plain ESLint rules: `meta` plus `create(context)`, never Oxlint's
`createOnce`, and the package has no runtime dependencies beyond the `@eslint/core` types. A rule is typed
`ExplicitRule` from `#helpers`: `@eslint/core`'s `RuleDefinition`, with
`TSESTree` nodes from `@typescript-eslint/types`, so `context.report` takes
TypeScript nodes. The `Explicit*` names come from the template repo,
eslint-plugin-explicit-types: `scripts/project-lint.ts` is copied from it
unchanged and imports `ExplicitRuleTypes` and `ExplicitSourceCode`, so the
names stay. The only runtime import is `node:fs`, which reads `package.json`.

ESLint's visitor type is loose, so every visitor annotates its node parameter
(`TSTypeOperator(node: TSESTree.TSTypeOperator): void`). Forget one and the
parameter is `any`; the type-aware `typescript/no-unsafe-*` rules in
`vite.config.ts` then fail. Verified by removing an annotation.

Why not the alternatives, all checked:

- `@typescript-eslint/utils`' `RuleModule` is assignable to neither ESLint's
  `RuleDefinition` nor Oxlint's `Rule` (its catch-all listener is
  `RuleFunction<never>`).
- Oxlint's `Rule` type would make the package depend on `@oxlint/plugins`.

The public `.d.ts` inlines the few `@eslint/core` types it needs; `vp pack`
reports that as "Detected dependencies in bundle", which `pack.deps.onlyBundle`
in `vite.config.ts` acknowledges.

Messages are one ESLint-style sentence. ESLint and Oxlint diagnostics have no
hint field, so Deno's hints moved to the rule docs, or into a suggestion's
message where a suggestion exists. Report with `messageId` and `data`
so tests can assert which message fired. See [[dual-ruletester]].

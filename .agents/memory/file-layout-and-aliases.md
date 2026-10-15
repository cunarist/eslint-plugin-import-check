---
description: This repo's # alias order is #plugin, #testing, #project-lint, #helpers (its own layer order); rule tests read src/testing/fixture/ through fixture()
---

The general layout is in [[plugin-layout-flat-rules]] and the alias rules in
[[imports-aliases-barrels]]. What is specific to this repo:

**Alias order is a layer order.** The repo's own `enforce-layer-order` reads
the `package.json` `imports` key order as layers, top first, so the order is
`#plugin`, `#testing`, `#project-lint`, `#helpers`: rules (owned by
`#plugin`) and the harness import `#helpers` below them. `#project-lint`
exists because `vite.config.ts` importing `./scripts/project-lint.ts` fails
`no-relative-bypass`; `vite.config.ts` imports `#plugin` for the same reason
(`prefer-alias-import`). Vite+ bundles the config and resolves both.

**Fixtures.** A rule that reads `package.json` needs a real path. A valid
case may be `{ code, filename }` and an invalid case may set `filename`,
both passed to both testers ([[plugin-dual-ruletester]]).
`fixture("src/utils/index.ts")` from `#testing` gives a path in
`src/testing/fixture/`, whose `package.json` holds the test `imports`. A
nested `src/utils/vendored/package.json` without `imports` proves the lookup
stops at the nearest `package.json` ([[node-subpath-imports]]). No rule opens
a source file, so no source file exists there. A case without a filename is
linted as `example.ts` in the working directory, which sees this repo's own
`package.json`.

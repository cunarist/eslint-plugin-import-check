---
description: This repo's # alias order is #plugin, #rules, #testing, #helpers (its own layer order), all src/ subfolders; vite.config.ts uses relative paths; rule tests read src/testing/fixture/ through fixture()
---

The general layout is in [[plugin-layout-flat-rules]] and the alias rules in
[[imports-aliases-barrels]]. What is specific to this repo:

**Alias order is a layer order.** The repo's own `enforce-layer-order` reads
the `package.json` `imports` key order as layers, top first, so the order is
`#plugin`, `#rules`, `#testing`, `#helpers`: the plugin imports the rule
registry, rule tests import the harness, and everything imports `#helpers`.

**Only `src/` subfolders get aliases** (user rule, 2026-10-16). The old
`#plugin` pointed at `./src/index.ts` (`src/` itself) and `#project-lint` at
`./scripts/project-lint.ts`; both broke the rule. The plugin moved to
`src/plugin/index.ts`, which the new `#plugin` names. `src/index.ts` was
then deleted (user decision, 2026-10-16): `src/plugin/index.ts` is the
package entry itself and `vp pack` names its output `dist/index.js`. `tests/`
imports only through `#` aliases, never a parent-relative `../src/...` (`no-parent-import`,
`import/no-relative-parent-imports`, and no overrides for test code). The
plugin reaches the registry through `#rules` for the same reason.
`vite.config.ts` imports the plugin through `#plugin` (its own
`prefer-alias-import` rewrites a `./src/plugin/index.ts` path) and
`./scripts/project-lint.ts` relatively; the second reaches past `./scripts`, so a narrow `overrides`
entry turns `no-relative-bypass` off for `vite.config.ts` alone (tooling, like
`scripts/**`, see [[lint-overrides-policy]]). Vite+ bundles the config and
resolves both.

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

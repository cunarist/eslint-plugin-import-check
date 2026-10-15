---
description: One plugin, namespace @cunarist/import-check, default export only; the Deno plugin survives as plugin.configs["import-check"], plus all
---

ESLint's convention is one plugin per package, named from the package:
`@cunarist/eslint-plugin-import-check` becomes the namespace
`@cunarist/import-check`. Oxlint normalizes `meta.name` the same way, so a rule
id is `@cunarist/import-check/enforce-layer-order` under both.

The Deno package had one lint plugin, `import-check` (its `./lint` entry). It
survives as the flat config `plugin.configs["import-check"]`, plus `.all` with
every rule, the same rule for every cunarist port: one config per former Deno
plugin, plus `all`. `all` is built from the rule registry, so a new rule joins
it without an edit; `tests/configs.test.ts` checks it equals `import-check`.
There is no `recommended` and no `meta.docs.recommended`.

The package has only a default export, the plugin; the Deno package's named
rule exports (`noSelfImport`, ...) are gone, as in every cunarist port. ESLint
users list `plugin.configs["import-check"]`; Oxlint, whose plugins have no
`configs`, spreads `plugin.configs["import-check"].rules` next to
`jsPlugins: ["@cunarist/eslint-plugin-import-check"]`.

**No rule takes options.** The Deno rules had none.

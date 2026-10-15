---
description: The repo's own lint config comes from the template; parity with deno-import-check's own deno.json lint config is not fully audited
---

`configs.project` in `scripts/project-lint.ts` is the template's list, which
was audited against the explicit-types repo's Deno config (the
`recommended`/`jsr` tags plus its include list). See
cunarist/eslint-plugin-explicit-types#1 for that table. It also turns on
`import/no-cycle`, which stands in for the Deno CLI's cycle check.

The Deno config of this repo differed. Beyond the tags it included
`no-external-import` and `prefer-ascii`, and ran
`jsr:@hugoalh/deno-lint-rules@0.8.3/recommended` (excluding
`hugoalh/no-duplicate-imports` and `hugoalh/no-import-self`). None of those
three was mapped to an Oxlint rule in the port; that gap is open, not decided.
Before removing a line from `configs.project`, find what else covers it
([[lint-parity-never-shrinks]]).

`maxWarnings: 0` keeps Deno's every-diagnostic-fails behaviour.

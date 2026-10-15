---
description: Entry points are index.ts; enforce-mod-file keeps its Deno name but requires index.ts and rejects mod
---

Node.js and Vite+ expect `index.ts` (`vp pack`'s default entry, editors'
auto-import), and the template repo uses it everywhere. So the port flips the
Deno convention: `enforce-mod-file` now rejects a file named `mod` and any
project specifier pointing at one, and requires `index.ts`.

The rule id stays `enforce-mod-file` because the port keeps every Deno rule
name. The name now says the opposite of what the rule does; renaming it (e.g.
`enforce-index-file`) is an open question for the user.

`BARREL_STEMS` holds both `index` and `mod`, so `no-relative-bypass` and the
layer rules still recognize a `mod` entry point when `enforce-mod-file` is off,
mirroring how Deno kept `index` recognized.

---
description: package.json imports replace deno.json imports; key order is the layer order; "#x/*" patterns replace trailing-slash mappings
---

`src/helpers/imports.ts` reads the nearest `package.json` `imports` with
`node:fs` and `JSON.parse` (reading a file is not an import, so
`project/no-non-ts-imports` is unaffected). `JSON.parse` keeps key order for
`#` keys, which are never integer-like, so the layer order maps 1:1.
`fmt.sortPackageJson` is off and npm leaves `imports` alone.

- Node.js has no trailing-slash folder mappings (`"#components/"`). They became
  subpath patterns, `"#components/*": "./src/components/*"`. A pattern whose
  prefix ends in `/` and has no suffix belongs to the exact entry of the same
  name (`#components`), which `no-barrel-bypass` suggests and the layer rules
  resolve to. Longest prefix wins, exact keys before patterns, as in Node.js.
- A catch-all `"#/*"` is reported by `no-barrel-bypass` like any other pattern,
  with no entry point to suggest.
- Only string targets starting with `./` or `../` are read. Package targets
  (`"#lit": "lit"`) and condition objects are ignored, as Deno ignored
  `jsr:`/`npm:` targets.
- Discovery follows Node.js, not Deno: walk up from the file and stop at the
  nearest `package.json`, even when it has no local `#` entry, so a nested
  package never borrows an enclosing one's imports (decided 2026-10-16;
  Deno kept walking to the first file with a `#` entry). A fixture under
  `src/testing/fixture/src/utils/vendored/` tests it.
- `deno.jsonc` and JSONC are gone: `package.json` is strict JSON. An
  unparsable nearest file gives no config; the search does not go past it.
- Parsed configs are cached per file path and reused only while its `mtimeMs`
  is unchanged, so an editor's long-lived lint process sees edits. Deno cached
  per directory for the whole run.

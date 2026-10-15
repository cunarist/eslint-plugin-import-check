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
- Discovery is 1:1 with Deno: walk up from the file and use the first
  `package.json` that has a local `#` entry. Node.js itself stops at the
  nearest `package.json`; whether to stop there too is an open question.
- `deno.jsonc` and JSONC are gone: `package.json` is strict JSON. An
  unparsable file is skipped, as Deno skipped one.
- Parsed configs are cached per file path and reused only while its `mtimeMs`
  is unchanged, so an editor's long-lived lint process sees edits. Deno cached
  per directory for the whole run.

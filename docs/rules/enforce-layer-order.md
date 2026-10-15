# @cunarist/import-check/enforce-layer-order

📝 Enforce the order of `package.json` `imports` as the layer order.

💼 This rule is enabled in the 🧭 `import-check` [config](https://github.com/cunarist/eslint-plugin-import-check#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

The order of `#` entries in `package.json` `imports` is the layer order,
top layer first: a module may only import modules declared below it. This
makes cycles between modules structurally impossible rather than merely
detectable, and the `imports` map doubles as documentation of the layers.

```json
{
  "imports": {
    "#components": "./src/components/index.ts",
    "#utils": "./src/utils/index.ts",
    "#types": "./src/types/index.ts"
  }
}
```

- An entry that points at an entry-point file (`index` or `mod`) owns its
  whole folder; an entry that points at any other file owns only that file.
  A file belongs to the most specific entry that owns it, and files no entry
  owns, such as scripts, are never checked.
- A target is resolved whether it is written as an exact alias, a subpath
  pattern such as `#components/x.ts`, or a relative path to an entry's file.
- A file importing its own module's entry point fires too, since that is a
  cycle waiting to happen. Use a same-folder relative import of the sibling
  file instead.
- To fix an upward import, either reorder the two entries or move the shared
  code into a module declared below both.

Examples of **incorrect** code for this rule:

```ts
// in ./src/utils/format.ts
import { Button } from "#components";
import { helper } from "#utils";
```

Examples of **correct** code for this rule:

```ts
// in ./src/utils/format.ts
import type { User } from "#types";
import { helper } from "./helper.ts";
```

## When Not To Use It

If your `imports` entries are not ordered by layer, turn this rule off.

# @cunarist/import-check/no-relative-bypass

📝 Disallow relative specifiers that reach past a subfolder's entry point.

💼 This rule is enabled in the 🧭 `import-check` [config](https://github.com/cunarist/eslint-plugin-import-check#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

The same principle as [`no-barrel-bypass`](no-barrel-bypass.md), for
relative paths. A `./` specifier may descend one level at most, and only into
that folder's entry point. Together with
[`no-parent-import`](no-parent-import.md) this leaves exactly two ways to
reach another module: a sibling file, or a `#` entry.

- A sibling, `./helper.ts`, is always allowed.
- A child entry point, `./sub/index.ts`, is allowed. An entry point is matched
  by stem, so `index` or `mod` with any extension counts.
- Anything else in a subfolder, or anything two or more levels down, fires.
  Import the folder's `index.ts` and re-export what you need from there.
- `../`, `#`, and package specifiers are left to other rules.

Examples of **incorrect** code for this rule:

```ts
import { thing } from "./sub/internal.ts";
import { deep } from "./sub/deep/index.ts";
```

Examples of **correct** code for this rule:

```ts
import { helper } from "./helper.ts";
import { thing } from "./sub/index.ts";
```

## When Not To Use It

If your folders are not modules with entry points, turn this rule off.

# @cunarist/import-check/no-barrel-bypass

📝 Disallow `#` specifiers that reach past a module's entry point.

💼 This rule is enabled in the 🧭 `import-check` [config](https://github.com/cunarist/eslint-plugin-import-check#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

A `#` subpath pattern such as `"#components/*": "./src/components/*"` lets
any file reach every file in a module, past its entry point. Whatever the
importer needs should be re-exported from the entry point instead, so the
module keeps exactly one public surface.

- A `#` specifier fires when it matches a subpath pattern of the nearest
  `package.json` and is not itself an exact entry.
- For a pattern ending in `/*` whose name without it is also an entry, such as
  `#components/*` beside `#components`, the rule suggests importing that
  entry point. It is a suggestion, not a fix: the entry point may not export
  the name yet.
- A catch-all pattern such as `"#/*": "./src/*"` makes every file reachable
  past its entry point, so it fires too, with no entry point to suggest.
- If you declare no subpath patterns at all, this rule never fires.
- Only imports from or into a folder a `#` entry owns are checked (see
  [Modules](../../README.md#modules)), so a pattern that links two files
  outside every module is left alone.

Examples of **incorrect** code for this rule:

```ts
// "#components": "./src/components/index.ts",
// "#components/*": "./src/components/*"
import { internal } from "#components/internal.ts";
```

Examples of **correct** code for this rule:

```ts
import { internal } from "#components";
```

## When Not To Use It

If you deliberately expose files inside a module through a subpath pattern,
turn this rule off.

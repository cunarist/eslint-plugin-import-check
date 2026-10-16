# @cunarist/import-check/no-parent-import

📝 Disallow parent-relative module specifiers.

💼 This rule is enabled in the 🧭 `import-check` [config](https://github.com/cunarist/eslint-plugin-import-check#configs-and-rules).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## Rule Details

Reaching up with `../` and back down couples two modules through their file
layout instead of their public surface: moving either folder breaks the import,
and nothing marks the target as something meant to be imported.

- Any specifier starting with `../` fires, in every import, re-export, dynamic
  `import()`, and type-level `import("...")`.
- When the nearest `package.json` has an `imports` entry that points at
  exactly the same file, the fix rewrites the specifier to that `#` alias,
  keeping the quote style. A backtick specifier becomes a double-quoted one.
- With no such entry the rule reports without a fix. Add an entry, or move the
  shared code into a module that already has one.
- Only imports from or into a folder a `#` entry owns are checked (see
  [Modules](../../README.md#modules)). Files outside every module, such as
  `tests/a.test.ts` importing `../scripts/build.ts`, may reach each other by
  path.

Examples of **incorrect** code for this rule:

```ts
// in ./src/components/index.ts
import { format } from "../utils/index.ts";
```

Examples of **correct** code for this rule:

```ts
// package.json: "imports": { "#utils": "./src/utils/index.ts" }
import { format } from "#utils";
```

## When Not To Use It

If your project does not use `package.json` `imports` and relies on relative
paths between folders, turn this rule off.

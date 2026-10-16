# @cunarist/import-check/prefer-alias-import

📝 Require the `#` alias for a module that `package.json` declares.

💼 This rule is enabled in the 🧭 `import-check` [config](https://github.com/cunarist/eslint-plugin-import-check#configs-and-rules).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## Rule Details

When `package.json` declares a `#` entry for a module, that entry is the
module's name. Reaching the same file through a `./` path gives it a second
spelling, which hides the dependency from anyone searching for the alias and
lets a path sidestep the layer order of
[`enforce-layer-order`](enforce-layer-order.md).

- Only `./` specifiers that leave the current folder fire, and only when an
  entry points at exactly the resolved file. The fix swaps in the alias,
  keeping the quote style.
- A same-folder sibling is never reported, even if it has an alias: that is the
  form every other rule recommends.
- A path to the importing file's own module entry point is left to
  `enforce-layer-order`, since switching to the alias would not fix it.
- `../` specifiers are left to [`no-parent-import`](no-parent-import.md),
  which offers the same rewrite.

Examples of **incorrect** code for this rule:

```ts
// in ./src/index.ts, with "#components": "./src/components/index.ts"
import { Button } from "./components/index.ts";
```

Examples of **correct** code for this rule:

```ts
import { Button } from "#components";
import { store } from "./app-store.ts";
```

## When Not To Use It

If you prefer paths to aliases for nearby modules, turn this rule off.

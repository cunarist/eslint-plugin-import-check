# eslint-plugin-import-check

Import-structure rules for both [ESLint](https://eslint.org) and [Oxlint](https://oxc.rs/docs/guide/usage/linter): a module graph that stays layered and free of cycles.\
Install with `npm install --save-dev @cunarist/eslint-plugin-import-check`. Requires Node.js 22+.

```ts
// Oxlint, through Vite+: vite.config.ts
import plugin from "@cunarist/eslint-plugin-import-check";
import { defineConfig } from "vite-plus";
const rules = { ...plugin.configs["import-check"].rules };
export default defineConfig({ lint: { jsPlugins: [plugin.meta.name], rules } });
```

```ts
// ESLint 9: eslint.config.ts (loading a .ts config needs jiti)
import plugin from "@cunarist/eslint-plugin-import-check";
import { parser } from "typescript-eslint";
const ts = { files: ["**/*.ts"], languageOptions: { parser } };
export default [ts, plugin.configs["import-check"]];
```

## Configs and rules

- `import-check`: modules reached through `package.json` `imports` entries, layered by their order.
- `all`: every rule, including ones added later. Rules take no options.

The order of the `#` entries in `package.json` is the layer order, top first; a module may only import modules declared below it.

<!-- prettier-ignore-start -->
<!-- begin auto-generated rules list -->

💼 [Configurations](https://github.com/cunarist/eslint-plugin-import-check#configs-and-rules) enabled in.\
🧭 Set in the `import-check` [configuration](https://github.com/cunarist/eslint-plugin-import-check#configs-and-rules).

| Name                                                                   | Description                                                            | 💼 |
| :--------------------------------------------------------------------- | :--------------------------------------------------------------------- | :- |
| [enforce-import-order](docs/rules/enforce-import-order.md)             | Enforce grouped and sorted import declarations and import members      | 🧭 |
| [enforce-layer-order](docs/rules/enforce-layer-order.md)               | Enforce the order of `package.json` `imports` as the layer order       | 🧭 |
| [enforce-mod-file](docs/rules/enforce-mod-file.md)                     | Enforce `index.ts` as the name of module entry points                  | 🧭 |
| [no-absolute-import](docs/rules/no-absolute-import.md)                 | Disallow absolute paths and `file:` URLs as module specifiers          | 🧭 |
| [no-barrel-bypass](docs/rules/no-barrel-bypass.md)                     | Disallow `#` specifiers that reach past a module's entry point         | 🧭 |
| [no-duplicate-import-source](docs/rules/no-duplicate-import-source.md) | Disallow separate import declarations from the same source             | 🧭 |
| [no-parent-import](docs/rules/no-parent-import.md)                     | Disallow parent-relative module specifiers                             | 🧭 |
| [no-relative-bypass](docs/rules/no-relative-bypass.md)                 | Disallow relative specifiers that reach past a subfolder's entry point | 🧭 |
| [no-self-import](docs/rules/no-self-import.md)                         | Disallow a module from importing itself                                | 🧭 |
| [no-wildcard-import](docs/rules/no-wildcard-import.md)                 | Disallow namespace imports                                             | 🧭 |
| [prefer-alias-import](docs/rules/prefer-alias-import.md)               | Require the `#` alias for a module that `package.json` declares        | 🧭 |

<!-- end auto-generated rules list -->
<!-- prettier-ignore-end -->

License: MIT.

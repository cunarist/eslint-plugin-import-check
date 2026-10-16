/**
 * `project` — lint rules this repository holds its own source to that are not
 * part of the published plugin. The published plugin mirrors the rules it was
 * ported with and nothing else; a rule kept only for this repo's own lint
 * lives in a flat `scripts/project-lint-*.ts` file and is registered here.
 * Its rules of its own are `no-disable-comments` (`project-lint-comments.ts`)
 * and `no-asset-imports` (`project-lint-modules.ts`); naming is checked by
 * Oxlint's built-in `id-match`.
 *
 * Loaded by `vite.config.ts` as an Oxlint `jsPlugins` entry, never packed:
 * `vp pack` builds `src/plugin/index.ts` alone and the tarball holds only `dist/`.
 *
 * @module
 */

import type { DummyRuleMap } from "vite-plus/lint";

import { noDisableCommentsRule } from "./project-lint-comments.ts";
import { noAssetImportsRule } from "./project-lint-modules.ts";

/**
 * This repository's own rule list, spread by `vite.config.ts` after the
 * published `all` config: rules beyond the Oxlint categories, plus a
 * few extras and opt-outs. Built-in Oxlint rule ids sit here too, so
 * `vite.config.ts` lists no rule by name.
 */
const rules: DummyRuleMap = {
  // Rules beyond the categories in `vite.config.ts`. First, naming: no
  // `_` inside the name once leading and trailing ones are trimmed,
  // unless it has no lowercase ASCII letter (UPPER_SNAKE). Shorthand
  // destructuring binds a key the code does not own, and property names
  // are not declarations.
  "id-match": [
    "error",
    "^_*[^_]*_*$|^[^a-z]*$",
    {
      properties: false,
      classFields: false,
      onlyDeclarations: false,
      ignoreDestructuring: true,
    },
  ],
  curly: "error",
  "guard-for-in": "error",
  "no-console": "error",
  "no-empty": "error",
  "no-regex-spaces": "error",
  "no-restricted-globals": ["error", "window"],
  "no-var": "error",
  "prefer-const": "error",
  "import/no-cycle": "error",
  "import/no-relative-parent-imports": "error",
  "typescript/adjacent-overload-signatures": "error",
  "typescript/consistent-type-imports": "error",
  "typescript/no-empty-interface": "error",
  "typescript/no-explicit-any": "error",
  "typescript/no-namespace": "error",
  "typescript/no-non-null-assertion": "error",
  "project/no-disable-comments": "error",
  "project/no-asset-imports": "error",
  "unicorn/no-abusive-eslint-disable": "error",
  // Pedantic rules that fight the AST types: nodes are mutable, and `type`
  // is an enum imported only as a type.
  "typescript/prefer-readonly-parameter-types": "off",
  "typescript/no-unsafe-enum-comparison": "off",
  "typescript/switch-exhaustiveness-check": ["error", { considerDefaultExhaustiveForUnions: true }],
  // Rule `create` visitors and the package.json reader run past 50 lines.
  "max-lines-per-function": "off",
};

/**
 * The repo-local plugin, namespace `project`: its own rules, enabled as
 * `project/<rule>`, and `configs.project`, the rule list above.
 */
const plugin = {
  meta: { name: "project" },
  rules: {
    "no-disable-comments": noDisableCommentsRule,
    "no-asset-imports": noAssetImportsRule,
  },
  configs: { project: { rules } },
};

export default plugin;

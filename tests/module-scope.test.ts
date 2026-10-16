/**
 * Regression: the folder-layout rules check only imports from or into a
 * folder a `#` entry owns. Files outside every module, such as
 * `vite.config.ts`, `scripts/` and `tests/`, import each other by path with no
 * entry point demanded, while module files still go through `#` entries.
 */

import plugin from "#plugin";
import { fixture, type TestedRule, testRule } from "#testing";

/** The published rule with this id. */
function rule(id: string): TestedRule {
  const found = plugin.rules?.[id];
  if (found === undefined) {
    throw new Error(`no rule named ${id}`);
  }
  return found;
}

const VITE_CONFIG = fixture("vite.config.ts");

const TEST_FILE = fixture("tests/build.test.ts");

/** Imports between files outside every module, which every rule allows. */
const PLAIN_FILE_IMPORTS = [
  { code: 'import { decorators } from "./scripts/decorators.ts";\n', filename: VITE_CONFIG },
  { code: 'import { lint } from "./scripts/mod.ts";\n', filename: VITE_CONFIG },
  { code: 'import { decorators } from "../scripts/decorators.ts";\n', filename: TEST_FILE },
  { code: 'import { config } from "../vite.config.ts";\n', filename: TEST_FILE },
  { code: "export const lint = 1;\n", filename: fixture("scripts/mod.ts") },
];

/** `src/components/` reaching into `src/utils/` without `#utils`. */
const REACH_IN = 'import { y } from "../utils/y.ts";\n';

testRule("no-relative-bypass", rule("no-relative-bypass"), {
  valid: PLAIN_FILE_IMPORTS,
  invalid: [
    {
      code: 'import { y } from "./utils/y.ts";\n',
      filename: fixture("src/types/index.ts"),
      errors: [{ messageId: "bypass" }],
    },
    {
      code: 'import { y } from "./src/utils/y.ts";\n',
      filename: VITE_CONFIG,
      errors: [{ messageId: "bypass" }],
    },
  ],
});

testRule("no-parent-import", rule("no-parent-import"), {
  valid: PLAIN_FILE_IMPORTS,
  invalid: [
    {
      code: REACH_IN,
      filename: fixture("src/components/x.ts"),
      errors: [{ messageId: "parentImport" }],
    },
  ],
});

testRule("no-barrel-bypass", rule("no-barrel-bypass"), {
  valid: PLAIN_FILE_IMPORTS,
  invalid: [
    {
      code: 'import { y } from "#components/y.ts";\n',
      filename: fixture("src/utils/x.ts"),
      errors: [
        {
          messageId: "bypass",
          suggestions: [{ messageId: "useEntry", output: 'import { y } from "#components";\n' }],
        },
      ],
    },
  ],
});

testRule("enforce-mod-file", rule("enforce-mod-file"), {
  valid: PLAIN_FILE_IMPORTS,
  invalid: [
    {
      code: 'import { y } from "../components/mod.ts";\n',
      filename: fixture("src/utils/x.ts"),
      errors: [{ messageId: "specifier" }],
    },
  ],
});

testRule("enforce-layer-order", rule("enforce-layer-order"), {
  valid: PLAIN_FILE_IMPORTS,
  invalid: [
    {
      code: 'import { y } from "#components";\n',
      filename: fixture("src/utils/x.ts"),
      errors: [{ messageId: "upward" }],
    },
  ],
});

testRule("prefer-alias-import", rule("prefer-alias-import"), {
  valid: PLAIN_FILE_IMPORTS,
  invalid: [
    {
      code: 'import { utils } from "./src/utils/index.ts";\n',
      filename: VITE_CONFIG,
      output: 'import { utils } from "#utils";\n',
      errors: [{ messageId: "useAlias" }],
    },
  ],
});

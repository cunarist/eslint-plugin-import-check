import { fixture, spanOf, testRule } from "#testing";

import { noParentImportRule } from "./no-parent-import.ts";

const COMPONENTS = fixture("src/components/index.ts");

const parentCode = 'import { utils } from "../utils/index.ts";\n';

/** An error rewriting `specifier` to `#utils`. */
const TO_UTILS = {
  messageId: "useAlias",
  data: { specifier: "../utils/index.ts", alias: "#utils" },
};

testRule("no-parent-import", noParentImportRule, {
  valid: [
    // ignores same-folder, alias, and package imports
    {
      code: 'import { internal } from "./internal.ts";\nimport { utils } from "#utils";\nimport { html } from "#lit";\n',
      filename: COMPONENTS,
    },

    // lets files outside every "#" module import each other by path
    {
      code: 'import { build } from "../scripts/build.ts";\n',
      filename: fixture("tests/a.test.ts"),
    },
    {
      code: 'import { config } from "../vite.config.ts";\n',
      filename: fixture("scripts/build.ts"),
    },
  ],
  invalid: [
    // replaces a parent import with its "#" entry
    {
      code: parentCode,
      filename: COMPONENTS,
      output: 'import { utils } from "#utils";\n',
      errors: [{ ...TO_UTILS, ...spanOf(parentCode, '"../utils/index.ts"') }],
    },

    // keeps the original quote style
    {
      code: "import { utils } from '../utils/index.ts';\n",
      filename: COMPONENTS,
      output: "import { utils } from '#utils';\n",
      errors: [TO_UTILS],
    },

    // covers re-exports and dynamic imports
    {
      code: 'export * from "../utils/index.ts";\nexport { utils } from "../utils/index.ts";\nconst mod = await import("../utils/index.ts");\n',
      filename: COMPONENTS,
      output:
        'export * from "#utils";\nexport { utils } from "#utils";\nconst mod = await import("#utils");\n',
      errors: [TO_UTILS, TO_UTILS, TO_UTILS],
    },

    // rewrites a backtick specifier as a quoted one
    {
      code: "const m = await import(`../utils/index.ts`);\n",
      filename: COMPONENTS,
      output: 'const m = await import("#utils");\n',
      errors: [TO_UTILS],
    },

    // reports without a fix when no entry matches
    {
      code: 'import { thing } from "../unmapped/index.ts";\n',
      filename: COMPONENTS,
      errors: [{ messageId: "parentImport", data: { specifier: "../unmapped/index.ts" } }],
    },

    // reports without a fix when no "#" entry points at the target
    {
      code: 'import { thing } from "../thing.ts";\n',
      filename: COMPONENTS,
      errors: [{ messageId: "parentImport", data: { specifier: "../thing.ts" } }],
    },

    // still checks a file outside the modules reaching into one
    {
      code: 'import { utils } from "../src/utils/index.ts";\n',
      filename: fixture("tests/a.test.ts"),
      output: 'import { utils } from "#utils";\n',
      errors: [
        { messageId: "useAlias", data: { specifier: "../src/utils/index.ts", alias: "#utils" } },
      ],
    },
  ],
});

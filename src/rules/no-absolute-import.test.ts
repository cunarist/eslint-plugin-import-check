import { spanOf, testRule } from "#testing";

import { noAbsoluteImportRule } from "./no-absolute-import.ts";

const slashCode = 'import { c } from "/src/components/internal.ts";\n';

testRule("no-absolute-import", noAbsoluteImportRule, {
  valid: [
    // leaves relative, alias, and package specifiers alone
    'import { a } from "./internal.ts";\nimport { b } from "#types";\nimport { c } from "lit";\n',
  ],
  invalid: [
    // rejects a leading slash
    {
      code: slashCode,
      errors: [
        {
          messageId: "absolute",
          data: { specifier: "/src/components/internal.ts" },
          ...spanOf(slashCode, '"/src/components/internal.ts"'),
        },
      ],
    },

    // rejects a file URL
    {
      code: 'import { t } from "file:///C:/project/src/thing.ts";\n',
      errors: [{ messageId: "absolute", data: { specifier: "file:///C:/project/src/thing.ts" } }],
    },
  ],
});

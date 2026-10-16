import { testRule } from "#testing";

import { noDuplicateImportSourceRule } from "./no-duplicate-import-source.ts";

const duplicateCode =
  'import { a } from "#utils";\nimport type { Utils } from "#utils";\nimport "#utils";\n';

const DUPLICATE = { messageId: "duplicate", data: { specifier: "#utils" } };

testRule("no-duplicate-import-source", noDuplicateImportSourceRule, {
  valid: [
    // keeps a type-only and a bare import of one source
    'import type { Utils } from "#utils";\nimport "#utils";\n',

    // compares exact static sources, leaving re-exports and dynamic imports alone
    'import { a } from "#utils";\nimport { b } from "#components";\nexport { c } from "#utils";\nconst mod = await import("#utils");\n',
  ],
  invalid: [
    // reports every repeated source beside the first value import
    {
      code: duplicateCode,
      errors: [
        { ...DUPLICATE, line: 2 },
        { ...DUPLICATE, line: 3 },
      ],
    },

    // with no value import, keeps one type-only and one bare import
    {
      code: 'import type { A } from "#utils";\nimport type { B } from "#utils";\nimport "#utils";\nimport "#utils";\n',
      errors: [DUPLICATE, DUPLICATE],
    },
  ],
});

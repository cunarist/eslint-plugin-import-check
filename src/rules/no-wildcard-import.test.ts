import { spanOf, testRule } from "#testing";

import { noWildcardImportRule } from "./no-wildcard-import.ts";

const wildcardCode = 'import * as internal from "./internal.ts";\n';

const WILDCARD = { messageId: "wildcard" };

testRule("no-wildcard-import", noWildcardImportRule, {
  valid: [
    // allows default, named, type-only, and side-effect imports
    'import value from "./value.ts";\nimport { internal } from "./internal.ts";\nimport type { Types } from "./types.ts";\nimport "./setup.ts";\n',

    // leaves re-exports alone
    'export * from "./internal.ts";\nexport * as internal from "./internal.ts";\n',
  ],
  invalid: [
    // rejects a namespace import, highlighting the binding
    {
      code: wildcardCode,
      errors: [{ ...WILDCARD, ...spanOf(wildcardCode, "* as internal") }],
    },

    // rejects a type-only namespace import and one beside a default import
    {
      code: 'import type * as types from "./types.ts";\nimport value, * as rest from "./value.ts";\n',
      errors: [WILDCARD, WILDCARD],
    },
  ],
});

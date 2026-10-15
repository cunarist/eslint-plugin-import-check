import { fixture, spanOf, testRule } from "#testing";

import { preferAliasImportRule } from "./prefer-alias-import.ts";

const SRC = fixture("src/index.ts");

const aliasCode = 'import { c } from "./components/index.ts";\n';

testRule("prefer-alias-import", preferAliasImportRule, {
  valid: [
    // leaves same-folder siblings alone, even with an alias
    { code: 'import { s } from "./app-store.ts";\n', filename: SRC },

    // ignores paths with no declared entry
    { code: 'import { u } from "./unmapped/index.ts";\n', filename: SRC },
  ],
  invalid: [
    // rewrites a path that has an alias
    {
      code: aliasCode,
      filename: SRC,
      output: 'import { c } from "#components";\n',
      errors: [
        {
          messageId: "useAlias",
          data: { specifier: "./components/index.ts", alias: "#components" },
          ...spanOf(aliasCode, '"./components/index.ts"'),
        },
      ],
    },
  ],
});

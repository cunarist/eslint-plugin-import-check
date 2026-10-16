import { fixture, spanOf, testRule } from "#testing";

import { noSelfImportRule } from "./no-self-import.ts";

const INTERNAL = fixture("src/components/internal.ts");

const selfCode = 'import { a } from "./internal.ts";\n';

/** An error for `specifier` naming the current file. */
function self(specifier: string): { messageId: string; data: { specifier: string } } {
  return { messageId: "selfImport", data: { specifier } };
}

testRule("no-self-import", noSelfImportRule, {
  valid: [
    // leaves other modules alone
    {
      code: 'import { helper } from "./helper.ts";\nimport { components } from "#components";\nimport { html } from "lit";\n',
      filename: INTERNAL,
    },
  ],
  invalid: [
    // covers every statically known dependency form
    {
      code: selfCode,
      filename: INTERNAL,
      errors: [{ ...self("./internal.ts"), ...spanOf(selfCode, '"./internal.ts"') }],
    },
    {
      code: 'export { b } from "./internal.ts";\nexport * from "./internal.ts";\nconst mod = await import("./internal.ts");\nexport type T = import("./internal.ts").T;\n',
      filename: INTERNAL,
      errors: [
        self("./internal.ts"),
        self("./internal.ts"),
        self("./internal.ts"),
        self("./internal.ts"),
      ],
    },

    // resolves exact and pattern aliases
    {
      code: 'import { components } from "#components";\n',
      filename: fixture("src/components/index.ts"),
      errors: [self("#components")],
    },
    {
      code: 'import { internal } from "#components/internal.ts?raw";\n',
      filename: INTERNAL,
      errors: [self("#components/internal.ts?raw")],
    },
  ],
});

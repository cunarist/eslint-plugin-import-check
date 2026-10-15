import { fixture, testRule } from "#testing";

import { enforceModFileRule } from "./enforce-mod-file.ts";

const SRC = fixture("src/index.ts");

/** An error for a specifier pointing at a `mod` file. */
function specifier(text: string): { messageId: string; data: { specifier: string } } {
  return { messageId: "specifier", data: { specifier: text } };
}

testRule("enforce-mod-file", enforceModFileRule, {
  valid: [
    // leaves index files and packages alone
    {
      code: 'import { a } from "./components/index.ts";\nimport { b } from "some-pkg/mod.ts";\n',
      filename: SRC,
    },
  ],
  invalid: [
    // rejects a file named mod.ts
    {
      code: "export const thing = 1;\n",
      filename: fixture("src/components/mod.ts"),
      errors: [{ messageId: "fileName", data: { name: "mod.ts" } }],
    },

    // catches mod files of any extension
    {
      code: 'import { a } from "./components/mod.jsx";\nimport { b } from "./components/mod.mts";\n',
      filename: fixture("src/mod.js"),
      errors: [
        { messageId: "fileName", data: { name: "mod.js" } },
        specifier("./components/mod.jsx"),
        specifier("./components/mod.mts"),
      ],
    },

    // rejects specifiers pointing at a mod file
    {
      code: 'import { a } from "./components/mod.ts";\nimport { b } from "#components/mod.ts";\n',
      filename: SRC,
      errors: [specifier("./components/mod.ts"), specifier("#components/mod.ts")],
    },
  ],
});

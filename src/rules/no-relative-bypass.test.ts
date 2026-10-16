import { fixture, spanOf, testRule } from "#testing";

import { noRelativeBypassRule } from "./no-relative-bypass.ts";

const SRC = fixture("src/index.ts");

const internalCode = 'import { internal } from "./components/internal.ts";\n';

testRule("no-relative-bypass", noRelativeBypassRule, {
  valid: [
    // allows a sibling and a child entry point
    {
      code: 'import { helper } from "./helper.ts";\nimport { components } from "./components/index.ts";\n',
      filename: SRC,
    },

    // recognizes entry points whatever the extension
    {
      code: 'import { a } from "./components/index.tsx";\nimport { b } from "./components/index.js";\nimport { c } from "./components/index.mts";\n',
      filename: SRC,
    },

    // ignores parent and package specifiers
    {
      code: 'import { utils } from "../utils/deep/thing.ts";\nimport { html } from "lit/directives/class-map.js";\n',
      filename: SRC,
    },
  ],
  invalid: [
    // rejects reaching past a subfolder entry point
    {
      code: internalCode,
      filename: SRC,
      errors: [
        {
          messageId: "bypass",
          data: { specifier: "./components/internal.ts", folder: "components" },
          ...spanOf(internalCode, '"./components/internal.ts"'),
        },
      ],
    },

    // treats a child mod file as an internal file, not an entry point
    {
      code: 'import { legacy } from "./components/mod.ts";\n',
      filename: SRC,
      errors: [
        { messageId: "bypass", data: { specifier: "./components/mod.ts", folder: "components" } },
      ],
    },

    // rejects descending more than one level, even to an entry point
    {
      code: 'import { deep } from "./src/components/index.ts";\n',
      filename: fixture("index.ts"),
      errors: [
        { messageId: "bypass", data: { specifier: "./src/components/index.ts", folder: "src" } },
      ],
    },
  ],
});

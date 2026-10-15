import { fixture, spanOf, testRule } from "#testing";

import { noBarrelBypassRule } from "./no-barrel-bypass.ts";

const APP_STORE = fixture("src/app-store.ts");

const bypassCode = 'import { internal } from "#components/internal.ts";\n';

testRule("no-barrel-bypass", noBarrelBypassRule, {
  valid: [
    // allows the exact module specifier
    { code: 'import { components } from "#components";\n', filename: APP_STORE },

    // allows a package alias and a specifier no pattern matches
    {
      code: 'import { html } from "#lit";\nimport { x } from "#other/x.ts";\n',
      filename: APP_STORE,
    },

    // never fires for a "#" specifier the nearest package.json lacks
    'import { internal } from "#components/internal.ts";\n',
  ],
  invalid: [
    // rejects reaching past a module entry point, suggesting the entry point
    {
      code: bypassCode,
      filename: APP_STORE,
      errors: [
        {
          messageId: "bypass",
          data: { specifier: "#components/internal.ts", owner: "#components" },
          ...spanOf(bypassCode, '"#components/internal.ts"'),
          suggestions: [
            {
              messageId: "useEntry",
              data: { owner: "#components" },
              output: 'import { internal } from "#components";\n',
            },
          ],
        },
      ],
    },

    // rejects a catch-all pattern, which has no entry point to suggest
    {
      code: 'import { utils } from "#/utils/index.ts";\n',
      filename: APP_STORE,
      errors: [
        { messageId: "internals", data: { specifier: "#/utils/index.ts" }, suggestions: [] },
      ],
    },
  ],
});

---
description: enforce-import-order is the only import sorter; never enable Oxfmt sortImports or another sorter beside it
---

`enforce-import-order` orders packages, then `#` aliases, then relative paths,
blank-line separated, specifiers by code point and brace members
case-insensitively. Do not add a second sorter: the Deno repo removed
`@ayk/lint-import-order` because it classified `#` specifiers as packages, and
the two undid each other's fixes. Oxfmt's `sortImports` is off by default;
keep it off here. It groups the same way but orders case-insensitively.

The autofix moves whole import statements, which reorders side-effect imports,
exactly as the Deno rule did. It refuses when a comment or another statement
sits inside the block.

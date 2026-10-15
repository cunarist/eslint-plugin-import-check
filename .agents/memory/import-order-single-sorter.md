---
description: enforce-import-order is the only import sorter; never enable Oxfmt sortImports or another sorter beside it
---

`enforce-import-order` orders packages, then `#` aliases, then relative paths,
blank-line separated, specifiers by code point and brace members
case-insensitively. Do not add a second sorter: the Deno repo removed
`@ayk/lint-import-order` because it classified `#` specifiers as packages, and
the two undid each other's fixes. Oxfmt's `sortImports` is off by default;
keep it off here. It groups the same way but orders case-insensitively.

The autofix moves whole import statements but never a side-effect import
(`import "x";`): those keep their places, and other imports are sorted only
within the runs between them (decided 2026-10-16; the Deno fix moved them).
Reporting is unchanged from Deno; a block that cannot be put fully in order
without moving a side-effect import is reported without a fix, never fixed
halfway. The fix also refuses when a comment or another statement sits
inside the block, when a comment sits anywhere in an import whose brace list
it would sort, and when a wrapped brace list starts on the `import {` line.

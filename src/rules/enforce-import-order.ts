import type { RuleFixer, RuleTextEdit } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type ExplicitRule, type ExplicitSourceCode } from "#helpers";

/** The three import groups, in the order they must appear. */
const IMPORT_GROUPS: string[] = ["package", "`#` alias", "relative"];

/** Every line break, for counting the lines between two imports. */
const NEWLINE_PATTERN: RegExp = /\n/gu;

/**
 * Classifies a specifier into its `IMPORT_GROUPS` index. Anything that is
 * neither a `#` alias nor a path is a package, which covers bare names,
 * `node:` builtins, and URLs alike.
 */
function importGroup(specifier: string): number {
  if (specifier.startsWith("#")) {
    return 1;
  }
  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    return 2;
  }
  return 0;
}

/** The name of a group, for a message. */
function groupName(group: number): string {
  return IMPORT_GROUPS[group] ?? "";
}

/**
 * Orders specifiers by code point rather than locale, so the result does not
 * depend on collation rules that quietly ignore punctuation.
 */
function compareSpecifiers(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  return a > b ? 1 : 0;
}

/**
 * Orders imported names case insensitively, unlike `compareSpecifiers`.
 * Specifiers are lowercase paths where only punctuation is ambiguous, but a
 * member list mixes `PascalCase` types, `camelCase` functions and
 * `SCREAMING_CASE` constants. Sorting those by code point would clump them by
 * case, which hides the alphabetical order a reader is scanning for.
 */
function compareMembers(a: string, b: string): number {
  const lowered = compareSpecifiers(a.toLowerCase(), b.toLowerCase());
  return lowered === 0 ? compareSpecifiers(a, b) : lowered;
}

/**
 * The names inside the braces of an import, in source order. Default and
 * namespace bindings sit outside the braces and are left alone.
 */
function namedSpecifiers(node: TSESTree.ImportDeclaration): TSESTree.ImportSpecifier[] {
  return node.specifiers.filter(
    (specifier): specifier is TSESTree.ImportSpecifier => specifier.type === "ImportSpecifier",
  );
}

/** The name a member is sorted by, which is the one written first. */
function memberName(specifier: TSESTree.ImportSpecifier): string {
  const imported = specifier.imported;
  return imported.type === "Identifier" ? imported.name : specifier.local.name;
}

/** Whether a comment lies inside a range of the source. */
function hasCommentWithin(source: ExplicitSourceCode, start: number, end: number): boolean {
  return source
    .getAllComments()
    .some((comment) => comment.range[0] >= start && comment.range[1] <= end);
}

/**
 * Rewrites the braces of one import in sorted order, preserving whether the
 * list was written on one line or spread across several. `null` when a
 * comment inside the braces would be lost.
 */
function fixMemberOrder(
  source: ExplicitSourceCode,
  members: TSESTree.ImportSpecifier[],
): RuleFixer | null {
  const first = members.at(0);
  const last = members.at(-1);
  if (first === undefined || last === undefined) {
    return null;
  }
  const start = first.range[0];
  const end = last.range[1];
  if (hasCommentWithin(source, start, end)) {
    return null;
  }
  const text = source.text;
  const sorted = members.toSorted((a, b) => compareMembers(memberName(a), memberName(b)));
  // Match the existing layout rather than reflowing it, so a list the
  // formatter already broke across lines stays broken.
  const multiline = text.slice(start, end).includes("\n");
  const indent = multiline ? text.slice(text.lastIndexOf("\n", start) + 1, start) : "";
  const separator = multiline ? `,\n${indent}` : ", ";
  const replacement = sorted.map((member) => source.getText(member)).join(separator);
  return (fixer): RuleTextEdit => fixer.replaceTextRange([start, end], replacement);
}

/** One import declaration with its specifier and group. */
interface ImportEntry {
  node: TSESTree.ImportDeclaration;
  specifier: string;
  group: number;
}

/**
 * Whether an import only runs a module for its side effects, as in
 * `import "./polyfill.ts";`. Such imports can depend on running before or
 * after their neighbours, so the fix never moves them.
 */
function isSideEffect(node: TSESTree.ImportDeclaration): boolean {
  return node.specifiers.length === 0;
}

/** Sorts imports by group, then by specifier. */
function compareEntries(a: ImportEntry, b: ImportEntry): number {
  return a.group - b.group || compareSpecifiers(a.specifier, b.specifier);
}

/**
 * The imports in their fixed order: side-effect imports keep their places,
 * and the imports in each run between them are sorted within that run, so no
 * import crosses a side-effect import.
 */
function fixedOrder(entries: ImportEntry[]): ImportEntry[] {
  const ordered: ImportEntry[] = [];
  let run: ImportEntry[] = [];
  for (const entry of entries) {
    if (isSideEffect(entry.node)) {
      ordered.push(...run.toSorted(compareEntries), entry);
      run = [];
    } else {
      run.push(entry);
    }
  }
  ordered.push(...run.toSorted(compareEntries));
  return ordered;
}

/**
 * Builds the whole-block rewrite, but only when nothing would be lost and the
 * rewrite changes something. Comments inside the block have no home in the
 * rewritten text, and statements interleaved between imports would be erased
 * by a single range replacement, so both cases give `null` and report
 * without a fix. When only side-effect imports are out of place, nothing may
 * move, so that gives `null` too.
 */
function fixImportBlock(
  source: ExplicitSourceCode,
  body: TSESTree.ProgramStatement[],
  entries: ImportEntry[],
): RuleFixer | null {
  const first = entries.at(0);
  const last = entries.at(-1);
  if (first === undefined || last === undefined) {
    return null;
  }
  const start = first.node.range[0];
  const end = last.node.range[1];
  const contiguous = body.indexOf(last.node) - body.indexOf(first.node) + 1 === entries.length;
  if (!contiguous || hasCommentWithin(source, start, end)) {
    return null;
  }
  let replacement = "";
  let previousGroup: number | null = null;
  for (const entry of fixedOrder(entries)) {
    if (previousGroup !== null) {
      replacement += entry.group === previousGroup ? "\n" : "\n\n";
    }
    replacement += source.getText(entry.node);
    previousGroup = entry.group;
  }
  if (replacement === source.text.slice(start, end)) {
    return null;
  }
  return (fixer): RuleTextEdit => fixer.replaceTextRange([start, end], replacement);
}

/** A problem between two neighbouring imports, as a message and its data. */
interface OrderProblem {
  messageId: string;
  data: Map<string, string>;
}

/** What is wrong between two neighbouring imports, or `null` if nothing. */
function orderProblem(
  previous: ImportEntry,
  current: ImportEntry,
  blankLine: boolean,
): OrderProblem | null {
  const names = new Map([
    ["group", groupName(current.group)],
    ["previous", groupName(previous.group)],
  ]);
  if (current.group < previous.group) {
    return { messageId: "groupOrder", data: names };
  }
  if (current.group > previous.group && !blankLine) {
    return { messageId: "missingBlankLine", data: names };
  }
  if (current.group === previous.group && blankLine) {
    return { messageId: "extraBlankLine", data: names };
  }
  if (
    current.group === previous.group &&
    compareSpecifiers(current.specifier, previous.specifier) < 0
  ) {
    return {
      messageId: "sourceOrder",
      data: new Map([
        ["specifier", current.specifier],
        ["previous", previous.specifier],
      ]),
    };
  }
  return null;
}

/**
 * `enforce-import-order` — groups imports as packages, then `#` aliases, then
 * relative paths, separated by a blank line and each sorted by code point.
 * Names inside the braces are sorted too, ignoring case and any `type`
 * modifier.
 *
 * The fix rewrites the import block, unless a comment or another statement
 * sits between the imports, so nothing gets discarded. Side-effect imports
 * stay where they are and no import is moved across one.
 */
export const enforceImportOrderRule: ExplicitRule = {
  meta: {
    type: "layout",
    docs: {
      description: "Enforce grouped and sorted import declarations and import members",
      url: docsUrl("enforce-import-order"),
    },
    fixable: "code",
    schema: [],
    messages: {
      memberOrder: "Expected '{{name}}' before '{{previous}}'.",
      groupOrder: "Expected {{group}} imports before {{previous}} imports.",
      missingBlankLine: "Expected a blank line between {{previous}} imports and {{group}} imports.",
      extraBlankLine: "Unexpected blank line between {{group}} imports.",
      sourceOrder: "Expected '{{specifier}}' before '{{previous}}'.",
    },
  },
  create(context) {
    const source = context.sourceCode;
    return {
      "Program:exit"(program: TSESTree.Program): void {
        const body = program.body;
        const imports = body.filter(
          (statement): statement is TSESTree.ImportDeclaration =>
            statement.type === "ImportDeclaration",
        );

        for (const node of imports) {
          const members = namedSpecifiers(node);
          for (const [index, member] of members.entries()) {
            const before = members[index - 1];
            if (before === undefined) {
              continue;
            }
            const name = memberName(member);
            const previous = memberName(before);
            if (compareMembers(name, previous) >= 0) {
              continue;
            }
            const fix = fixMemberOrder(source, members);
            context.report({
              node: member,
              messageId: "memberOrder",
              data: { name, previous },
              ...(fix === null ? {} : { fix }),
            });
            return;
          }
        }

        const entries: ImportEntry[] = imports.map((node) => ({
          node,
          specifier: node.source.value,
          group: importGroup(node.source.value),
        }));
        for (const [index, current] of entries.entries()) {
          const previous = entries[index - 1];
          if (previous === undefined) {
            continue;
          }
          const between = source.text.slice(previous.node.range[1], current.node.range[0]);
          const blankLine = (between.match(NEWLINE_PATTERN) ?? []).length >= 2;
          const problem = orderProblem(previous, current, blankLine);
          if (problem === null) {
            continue;
          }
          const fix = fixImportBlock(source, body, entries);
          context.report({
            node: current.node,
            messageId: problem.messageId,
            data: Object.fromEntries(problem.data),
            ...(fix === null ? {} : { fix }),
          });
          return;
        }
      },
    };
  },
};

/**
 * Types shared by the `project` plugin's rules in `project-lint-*.ts`.
 *
 * @module
 */

import type { RuleDefinition } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import type { ExplicitRuleTypes, ExplicitSourceCode } from "#helpers";

/** The published rules' source code, plus the comment list both hosts provide. */
export interface ProjectSourceCode extends ExplicitSourceCode {
  getAllComments(): TSESTree.Comment[];
}

/** The published rules' type parameters, with comments readable. */
export interface ProjectRuleTypes extends ExplicitRuleTypes {
  Code: ProjectSourceCode;
}

/** A repo-local rule, in ESLint's standard `create` form. */
export type ProjectRule = RuleDefinition<ProjectRuleTypes>;

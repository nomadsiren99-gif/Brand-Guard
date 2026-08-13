import { BrandIssue, IssueSeverity, RuleCategory } from "./issues.js";
import { NormalizedDocument } from "./document.js";
import { BrandKit } from "./brandKit.js";

export interface RuleContext {
  kit: BrandKit;
  colorMatcher?: any;
}

export interface FixContext {
  hostAdapter?: any;
}

export interface FixResult {
  success: boolean;
  message?: string;
  error?: unknown;
}

export interface BrandRule<TConfig = unknown> {
  id: string;
  name: string;
  category: RuleCategory;
  severity: IssueSeverity;
  config?: TConfig;

  evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]>;

  canFix?(issue: BrandIssue): boolean;

  fix?(
    issue: BrandIssue,
    context: FixContext
  ): Promise<FixResult>;
}

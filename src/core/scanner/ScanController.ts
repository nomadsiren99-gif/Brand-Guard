import { NormalizedDocument } from "../models/document.js";
import { BrandKit } from "../models/brandKit.js";
import { BrandIssue } from "../models/issues.js";
import { RuleRegistry } from "../rules/RuleRegistry.js";
import { RuleRunner } from "../rules/RuleRunner.js";
import { IssueStore } from "../issues/IssueStore.js";
import { ComplianceScoreService } from "../score/ComplianceScoreService.js";
import { IgnoreStore } from "../ignore/IgnoreStore.js";

export type ScanStatus = "idle" | "reading" | "scanning" | "complete" | "error";

export class ScanController {
  private status: ScanStatus = "idle";
  private progress: number = 0;
  private ruleRegistry: RuleRegistry;
  private ruleRunner: RuleRunner;
  private issueStore: IssueStore;
  private ignoreStore: IgnoreStore;
  private scoreService: ComplianceScoreService;

  constructor(
    ruleRegistry: RuleRegistry,
    ruleRunner: RuleRunner,
    issueStore: IssueStore,
    ignoreStore: IgnoreStore,
    scoreService: ComplianceScoreService
  ) {
    this.ruleRegistry = ruleRegistry;
    this.ruleRunner = ruleRunner;
    this.issueStore = issueStore;
    this.ignoreStore = ignoreStore;
    this.scoreService = scoreService;
  }

  getStatus(): ScanStatus {
    return this.status;
  }

  getProgress(): number {
    return this.progress;
  }

  async scanDocument(doc: NormalizedDocument, kit: BrandKit): Promise<{
    issues: BrandIssue[];
    score: number;
  }> {
    this.status = "scanning";
    this.progress = 0;

    const enabledRules = this.ruleRegistry.getEnabledRules(kit);
    this.progress = 50;

    let rawIssues = await this.ruleRunner.run({
      document: doc,
      kit,
      rules: enabledRules,
    });

    this.progress = 80;

    // Filter ignored issues
    const filteredIssues = rawIssues.filter(
      (issue) => !this.ignoreStore.isIgnored(issue.id, issue.ruleId, issue.nodeId)
    );

    this.issueStore.replace(filteredIssues);
    const score = this.scoreService.calculateScore(filteredIssues, doc.nodes.length);

    this.progress = 100;
    this.status = "complete";

    return { issues: filteredIssues, score };
  }
}

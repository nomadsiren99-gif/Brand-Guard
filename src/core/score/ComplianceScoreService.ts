import { BrandIssue } from "../models/issues.js";

export class ComplianceScoreService {
  /**
   * Calculates a compliance score (0 - 100) based on active open issues and node count.
   */
  calculateScore(issues: BrandIssue[], totalNodes: number = 1): number {
    const openIssues = issues.filter((i) => i.state === "open");
    if (openIssues.length === 0) return 100;

    let weightedViolations = 0;
    for (const issue of openIssues) {
      switch (issue.severity) {
        case "critical":
          weightedViolations += 10;
          break;
        case "error":
          weightedViolations += 5;
          break;
        case "warning":
          weightedViolations += 2;
          break;
        case "info":
          weightedViolations += 0.25;
          break;
      }
    }

    const normalizationFactor = Math.max(1, Math.log10(Math.max(10, totalNodes)));
    const score = Math.max(0, 100 - weightedViolations / normalizationFactor);
    return Math.round(score);
  }
}

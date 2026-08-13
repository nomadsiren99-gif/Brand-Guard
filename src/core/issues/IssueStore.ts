import { BrandIssue, IssueSeverity } from "../models/issues.js";

export class IssueStore {
  private issues: BrandIssue[] = [];

  replace(newIssues: BrandIssue[]): void {
    this.issues = [...newIssues];
  }

  getIssues(): BrandIssue[] {
    return this.issues.filter((i) => i.state === "open");
  }

  getAllIssues(): BrandIssue[] {
    return this.issues;
  }

  getFiltered(filters: {
    severity?: IssueSeverity;
    category?: string;
    search?: string;
  }): BrandIssue[] {
    return this.getIssues().filter((issue) => {
      if (filters.severity && issue.severity !== filters.severity) return false;
      if (filters.category && issue.category !== filters.category) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchTitle = issue.title.toLowerCase().includes(query);
        const matchNode = issue.location?.nodeName?.toLowerCase().includes(query);
        if (!matchTitle && !matchNode) return false;
      }
      return true;
    });
  }

  markIgnored(issueId: string): void {
    const issue = this.issues.find((i) => i.id === issueId);
    if (issue) {
      issue.state = "ignored";
    }
  }

  markFixed(issueId: string): void {
    const issue = this.issues.find((i) => i.id === issueId);
    if (issue) {
      issue.state = "fixed";
    }
  }

  clear(): void {
    this.issues = [];
  }
}

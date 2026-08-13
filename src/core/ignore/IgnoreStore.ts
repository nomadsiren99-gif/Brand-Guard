export type IgnoreScope =
  | "issue"
  | "node-rule"
  | "node"
  | "document-rule"
  | "document";

export interface IgnoreRecord {
  id: string;
  kitId: string;
  documentFingerprint?: string;
  ruleId?: string;
  nodeFingerprint?: string;
  scope: IgnoreScope;
  reason?: string;
  createdAt: string;
}

export class IgnoreStore {
  private records: IgnoreRecord[] = [];

  addIgnore(record: IgnoreRecord): void {
    this.records.push(record);
  }

  isIgnored(issueId: string, ruleId: string, nodeId?: string): boolean {
    return this.records.some((rec) => {
      if (rec.scope === "issue" && rec.id === issueId) return true;
      if (rec.scope === "node-rule" && rec.ruleId === ruleId && rec.nodeFingerprint === nodeId) return true;
      if (rec.scope === "node" && rec.nodeFingerprint === nodeId) return true;
      if (rec.scope === "document-rule" && rec.ruleId === ruleId) return true;
      return false;
    });
  }

  getRecords(): IgnoreRecord[] {
    return this.records;
  }
}

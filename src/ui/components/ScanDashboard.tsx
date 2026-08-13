import React, { useState } from "react";
import { BrandIssue, IssueSeverity, RuleCategory } from "../../core/models/issues";
import { NormalizedDocument } from "../../core/models/document";
import { ComplianceScoreCard } from "./ComplianceScoreCard";
import { IssueFiltersBar } from "./IssueFiltersBar";
import { IssueCard } from "./IssueCard";
import { BulkFixModal } from "./BulkFixModal";
import { Play, Wrench, FileCode, CheckCircle2 } from "lucide-react";

interface ScanDashboardProps {
  document: NormalizedDocument | null;
  score: number;
  issues: BrandIssue[];
  isScanning: boolean;
  scanProgress: number;
  onScan: () => void;
  onSelectNode: (hostId: string) => void;
  onFixIssue: (issue: BrandIssue) => void;
  onFixAllSafe: (safeIssues: BrandIssue[]) => void;
  onIgnoreIssue: (issueId: string, ruleId: string, nodeId?: string) => void;
}

export const ScanDashboard: React.FC<ScanDashboardProps> = ({
  document,
  score,
  issues,
  isScanning,
  scanProgress,
  onScan,
  onSelectNode,
  onFixIssue,
  onFixAllSafe,
  onIgnoreIssue,
}) => {
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<RuleCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);

  const filteredIssues = issues.filter((issue) => {
    if (issue.state !== "open") return false;
    // "Errors" covers critical too, otherwise critical issues have no tab.
    const matchesSeverity =
      severityFilter === "all" ||
      issue.severity === severityFilter ||
      (severityFilter === "error" && issue.severity === "critical");
    if (!matchesSeverity) return false;
    if (categoryFilter !== "all" && issue.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = issue.title.toLowerCase().includes(q);
      const matchNode = issue.location?.nodeName?.toLowerCase().includes(q);
      if (!matchTitle && !matchNode) return false;
    }
    return true;
  });

  const safeIssues = issues.filter((i) => i.state === "open" && i.fix && i.fix.safety === "safe");

  return (
    <div className="p-3 text-adobe-text select-none">
      {/* Active Document Indicator */}
      <div className="flex items-center justify-between bg-adobe-panel border border-adobe-border rounded px-2.5 py-1.5 mb-3 text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <FileCode className="w-4 h-4 text-adobe-accent shrink-0" />
          <span className="font-medium text-white truncate">{document?.name || "No active document"}</span>
        </div>
        {document && (
          <span className="text-[10px] text-adobe-muted shrink-0 font-mono">
            {document.width}×{document.height}px
          </span>
        )}
      </div>

      {/* Compliance Score */}
      <ComplianceScoreCard score={score} issues={issues} />

      {/* Action Bar */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onScan}
          disabled={isScanning}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-adobe-accent hover:bg-adobe-accentHover disabled:opacity-50 text-white font-semibold text-xs rounded transition-colors shadow"
        >
          {isScanning ? (
            <span>Scanning ({scanProgress}%)...</span>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Scan Document</span>
            </>
          )}
        </button>

        {safeIssues.length > 0 && (
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded transition-colors shadow"
            title="Fix all safe issues"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Fix Safe ({safeIssues.length})</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <IssueFiltersBar
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={issues.filter((i) => i.state === "open").length}
      />

      {/* Issue List */}
      <div className="mt-2">
        {filteredIssues.length === 0 ? (
          <div className="bg-adobe-panel border border-adobe-border rounded p-6 text-center text-adobe-muted">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <div className="font-bold text-white text-sm mb-1">
              {issues.length === 0 ? "Document Compliant!" : "No Matching Issues"}
            </div>
            <p className="text-xs">
              {issues.length === 0
                ? "No brand rule violations were detected in this document."
                : "Try adjusting your search or severity filters."}
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onSelectNode={onSelectNode}
              onFixIssue={onFixIssue}
              onIgnoreIssue={onIgnoreIssue}
            />
          ))
        )}
      </div>

      {showBulkModal && (
        <BulkFixModal
          safeIssues={safeIssues}
          onConfirmFixAll={() => onFixAllSafe(safeIssues)}
          onClose={() => setShowBulkModal(false)}
        />
      )}
    </div>
  );
};

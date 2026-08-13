import React from "react";
import { BrandIssue } from "../../core/models/issues.js";
import { AlertCircle, AlertTriangle, Info, Target, Wrench, EyeOff } from "lucide-react";

interface IssueCardProps {
  issue: BrandIssue;
  onSelectNode: (hostId: string) => void;
  onFixIssue: (issue: BrandIssue) => void;
  onIgnoreIssue: (issueId: string, ruleId: string, nodeId?: string) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onSelectNode,
  onFixIssue,
  onIgnoreIssue,
}) => {
  const isError = issue.severity === "error" || issue.severity === "critical";
  const isWarning = issue.severity === "warning";

  const badgeClass = isError
    ? "bg-rose-950/60 border-rose-600/50 text-rose-300"
    : isWarning
    ? "bg-amber-950/60 border-amber-600/50 text-amber-300"
    : "bg-blue-950/60 border-blue-600/50 text-blue-300";

  return (
    <div className="bg-adobe-panel border border-adobe-border rounded p-2.5 mb-2 hover:border-adobe-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {isError ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          ) : isWarning ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          )}
          <span className="font-semibold text-white text-xs leading-tight">{issue.title}</span>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeClass}`}>
          {issue.severity}
        </span>
      </div>

      {issue.location?.nodeName && (
        <div className="text-[11px] text-adobe-muted mb-1.5 flex items-center gap-1">
          <span className="text-adobe-text font-medium">{issue.location.nodeName}</span>
        </div>
      )}

      <p className="text-[11px] text-adobe-text/90 mb-2 leading-relaxed">{issue.description}</p>

      {(issue.actual !== undefined || issue.expected !== undefined) && (
        <div className="bg-adobe-bg/60 border border-adobe-border/50 rounded p-1.5 mb-2.5 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-adobe-muted block text-[10px] uppercase font-semibold">Found</span>
            <span className="font-mono text-rose-300 font-medium truncate block">{String(issue.actual)}</span>
          </div>
          <div>
            <span className="text-adobe-muted block text-[10px] uppercase font-semibold">Approved</span>
            <span className="font-mono text-emerald-400 font-medium truncate block">{String(issue.expected)}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-adobe-border/40">
        <div className="flex items-center gap-1">
          {issue.hostNodeId && (
            <button
              onClick={() => onSelectNode(issue.hostNodeId!)}
              className="flex items-center gap-1 px-2 py-1 bg-adobe-bg hover:bg-adobe-border text-adobe-text text-[11px] rounded transition-colors"
              title="Select layer in Photoshop/Illustrator"
            >
              <Target className="w-3 h-3 text-adobe-accent" />
              <span>Select</span>
            </button>
          )}

          <button
            onClick={() => onIgnoreIssue(issue.id, issue.ruleId, issue.nodeId)}
            className="flex items-center gap-1 px-2 py-1 bg-adobe-bg hover:bg-adobe-border text-adobe-muted hover:text-adobe-text text-[11px] rounded transition-colors"
            title="Ignore this issue"
          >
            <EyeOff className="w-3 h-3" />
            <span>Ignore</span>
          </button>
        </div>

        {issue.fix && (
          <button
            onClick={() => onFixIssue(issue)}
            className="flex items-center gap-1 px-2.5 py-1 bg-adobe-accent hover:bg-adobe-accentHover text-white text-[11px] font-medium rounded transition-colors shadow-sm"
          >
            <Wrench className="w-3 h-3" />
            <span>Fix Issue</span>
          </button>
        )}
      </div>
    </div>
  );
};

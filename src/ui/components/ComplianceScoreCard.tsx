import React from "react";
import { BrandIssue } from "../../core/models/issues.js";

interface ComplianceScoreCardProps {
  score: number;
  issues: BrandIssue[];
}

export const ComplianceScoreCard: React.FC<ComplianceScoreCardProps> = ({ score, issues }) => {
  const critical = issues.filter((i) => i.severity === "critical").length;
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const info = issues.filter((i) => i.severity === "info").length;

  const scoreColor =
    score >= 90
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : score >= 70
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-rose-400 border-rose-500/30 bg-rose-500/10";

  return (
    <div className="bg-adobe-panel border border-adobe-border rounded p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs text-adobe-muted font-medium uppercase tracking-wider">
            Brand Health
          </div>
          <div className="text-2xl font-bold text-white leading-tight">{score}%</div>
        </div>
        <div
          className={`px-3 py-1 rounded border text-xs font-semibold uppercase ${scoreColor}`}
        >
          {score >= 90 ? "Excellent" : score >= 70 ? "Needs Review" : "Non-Compliant"}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 text-center border-t border-adobe-border pt-2 text-xs">
        <div>
          <div className="text-rose-400 font-bold">{critical}</div>
          <div className="text-[10px] text-adobe-muted">Critical</div>
        </div>
        <div>
          <div className="text-red-400 font-bold">{errors}</div>
          <div className="text-[10px] text-adobe-muted">Errors</div>
        </div>
        <div>
          <div className="text-amber-400 font-bold">{warnings}</div>
          <div className="text-[10px] text-adobe-muted">Warnings</div>
        </div>
        <div>
          <div className="text-blue-400 font-bold">{info}</div>
          <div className="text-[10px] text-adobe-muted">Info</div>
        </div>
      </div>
    </div>
  );
};

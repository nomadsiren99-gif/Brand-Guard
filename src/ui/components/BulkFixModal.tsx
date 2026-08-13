import React from "react";
import { BrandIssue } from "../../core/models/issues";
import { Wrench, X } from "lucide-react";

interface BulkFixModalProps {
  safeIssues: BrandIssue[];
  onConfirmFixAll: () => void;
  onClose: () => void;
}

export const BulkFixModal: React.FC<BulkFixModalProps> = ({
  safeIssues,
  onConfirmFixAll,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-3 z-50">
      <div className="bg-adobe-panel border border-adobe-border rounded-lg max-w-sm w-full p-4 shadow-xl text-adobe-text">
        <div className="flex items-center justify-between border-b border-adobe-border pb-2 mb-3">
          <div className="flex items-center gap-1.5 font-bold text-white text-sm">
            <Wrench className="w-4 h-4 text-adobe-accent" />
            <span>Fix Safe Issues ({safeIssues.length})</span>
          </div>
          <button onClick={onClose} className="text-adobe-muted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-adobe-text/90 mb-3 leading-relaxed">
          The following {safeIssues.length} safe violations will be deterministically updated to their nearest approved brand values:
        </p>

        <div className="bg-adobe-bg/80 border border-adobe-border rounded p-2 max-h-40 overflow-y-auto mb-4 text-xs space-y-1">
          {safeIssues.map((issue) => (
            <div key={issue.id} className="flex items-center justify-between text-[11px] py-0.5 border-b border-adobe-border/30 last:border-none">
              <span className="truncate font-medium text-white">{issue.location?.nodeName || issue.title}</span>
              <span className="text-emerald-400 font-mono shrink-0 ml-2">{String(issue.expected)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-adobe-bg border border-adobe-border text-adobe-text hover:bg-adobe-border rounded text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirmFixAll();
              onClose();
            }}
            className="px-3 py-1.5 bg-adobe-accent hover:bg-adobe-accentHover text-white text-xs font-semibold rounded shadow transition-colors"
          >
            Apply {safeIssues.length} Fixes
          </button>
        </div>
      </div>
    </div>
  );
};

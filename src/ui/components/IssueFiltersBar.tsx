import React from "react";
import { IssueSeverity, RuleCategory } from "../../core/models/issues.js";
import { Search } from "lucide-react";

interface IssueFiltersBarProps {
  severityFilter: IssueSeverity | "all";
  setSeverityFilter: (severity: IssueSeverity | "all") => void;
  categoryFilter: RuleCategory | "all";
  setCategoryFilter: (category: RuleCategory | "all") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalCount: number;
}

export const IssueFiltersBar: React.FC<IssueFiltersBarProps> = ({
  severityFilter,
  setSeverityFilter,
  categoryFilter,
  setCategoryFilter,
  searchQuery,
  setSearchQuery,
  totalCount,
}) => {
  return (
    <div className="mb-2 flex flex-col gap-1.5">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-adobe-muted" />
        <input
          type="text"
          placeholder="Search issues or layers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-adobe-panel border border-adobe-border text-xs rounded pl-7 pr-2 py-1 text-white placeholder-adobe-muted focus:outline-none focus:border-adobe-accent"
        />
      </div>

      <div className="flex items-center justify-between gap-1 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSeverityFilter("all")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
              severityFilter === "all"
                ? "bg-adobe-accent text-white"
                : "bg-adobe-panel text-adobe-muted hover:text-white"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setSeverityFilter("error")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
              severityFilter === "error"
                ? "bg-rose-600 text-white"
                : "bg-adobe-panel text-adobe-muted hover:text-white"
            }`}
          >
            Errors
          </button>
          <button
            onClick={() => setSeverityFilter("warning")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
              severityFilter === "warning"
                ? "bg-amber-600 text-white"
                : "bg-adobe-panel text-adobe-muted hover:text-white"
            }`}
          >
            Warnings
          </button>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as any)}
          className="bg-adobe-panel border border-adobe-border text-[11px] rounded px-1.5 py-0.5 text-adobe-text focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="color">Color</option>
          <option value="typography">Typography</option>
          <option value="radius">Radius</option>
          <option value="stroke">Stroke</option>
          <option value="opacity">Opacity</option>
          <option value="spacing">Spacing</option>
          <option value="logo">Logo</option>
          <option value="naming">Naming</option>
        </select>
      </div>
    </div>
  );
};

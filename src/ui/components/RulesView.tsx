import React, { useState } from "react";
import { RuleRegistry } from "../../core/rules/RuleRegistry.js";
import { Sliders } from "lucide-react";

interface RulesViewProps {
  ruleRegistry: RuleRegistry;
}

export const RulesView: React.FC<RulesViewProps> = ({ ruleRegistry }) => {
  const rules = ruleRegistry.getAll();
  const [enabledState, setEnabledState] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    rules.forEach((r) => (map[r.id] = true));
    return map;
  });

  const toggleRule = (id: string) => {
    setEnabledState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-3 text-adobe-text select-none">
      <div className="flex items-center justify-between mb-3 border-b border-adobe-border pb-2">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-adobe-accent" />
            <span>Rule Management</span>
          </h2>
          <p className="text-[11px] text-adobe-muted">Enable or disable compliance checks</p>
        </div>
      </div>

      <div className="space-y-2">
        {rules.map((rule) => {
          const isEnabled = enabledState[rule.id] !== false;
          return (
            <div
              key={rule.id}
              className="bg-adobe-panel border border-adobe-border rounded p-2.5 flex items-center justify-between gap-2"
            >
              <div className="truncate">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-[10px] bg-adobe-bg px-1 py-0.5 rounded text-adobe-muted">
                    {rule.id}
                  </span>
                  <span className="font-semibold text-white text-xs truncate">{rule.name}</span>
                </div>
                <span className="text-[10px] text-adobe-muted capitalize">Category: {rule.category} | Severity: {rule.severity}</span>
              </div>

              <input
                type="checkbox"
                checked={isEnabled}
                onChange={() => toggleRule(rule.id)}
                className="w-4 h-4 accent-adobe-accent cursor-pointer shrink-0"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

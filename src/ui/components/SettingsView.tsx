import React, { useState } from "react";
import { Settings } from "lucide-react";

export const SettingsView: React.FC = () => {
  const [autoScanOnOpen, setAutoScanOnOpen] = useState(true);
  const [zoomOnSelect, setZoomOnSelect] = useState(false);
  const [allowSafeColorFixes, setAllowSafeColorFixes] = useState(true);
  const [allowSafeRadiusFixes, setAllowSafeRadiusFixes] = useState(true);

  return (
    <div className="p-3 text-adobe-text select-none text-xs">
      <div className="flex items-center justify-between mb-3 border-b border-adobe-border pb-2">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-adobe-accent" />
            <span>Plugin Settings</span>
          </h2>
          <p className="text-[11px] text-adobe-muted">Configure scanning & auto-fix preferences</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* General Settings */}
        <div>
          <h3 className="font-bold text-white mb-2 uppercase text-[10px] tracking-wider text-adobe-muted">
            General
          </h3>
          <div className="bg-adobe-panel border border-adobe-border rounded p-2.5 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span>Scan document when Brand Guard opens</span>
              <input
                type="checkbox"
                checked={autoScanOnOpen}
                onChange={(e) => setAutoScanOnOpen(e.target.checked)}
                className="w-4 h-4 accent-adobe-accent"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Zoom to layer when selected</span>
              <input
                type="checkbox"
                checked={zoomOnSelect}
                onChange={(e) => setZoomOnSelect(e.target.checked)}
                className="w-4 h-4 accent-adobe-accent"
              />
            </label>
          </div>
        </div>

        {/* Auto Fix Settings */}
        <div>
          <h3 className="font-bold text-white mb-2 uppercase text-[10px] tracking-wider text-adobe-muted">
            Safe Auto-Fixes
          </h3>
          <div className="bg-adobe-panel border border-adobe-border rounded p-2.5 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span>Allow safe color replacements</span>
              <input
                type="checkbox"
                checked={allowSafeColorFixes}
                onChange={(e) => setAllowSafeColorFixes(e.target.checked)}
                className="w-4 h-4 accent-adobe-accent"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Allow radius corrections</span>
              <input
                type="checkbox"
                checked={allowSafeRadiusFixes}
                onChange={(e) => setAllowSafeRadiusFixes(e.target.checked)}
                className="w-4 h-4 accent-adobe-accent"
              />
            </label>
          </div>
        </div>

        <div className="text-[10px] text-adobe-muted text-center pt-2">
          Brand Guard v1.0.0 (Photoshop + Illustrator UXP)
        </div>
      </div>
    </div>
  );
};

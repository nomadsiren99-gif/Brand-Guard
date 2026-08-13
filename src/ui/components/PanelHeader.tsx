import React from "react";
import { ShieldCheck, Sliders, Palette, Settings, Plus } from "lucide-react";
import { BrandKit } from "../../core/models/brandKit.js";

export type NavTab = "scan" | "rules" | "kit" | "reports" | "settings";

interface PanelHeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  kits: BrandKit[];
  activeKit: BrandKit | null;
  onSelectKit: (kitId: string) => void;
  onCreateKit?: () => void;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  activeTab,
  setActiveTab,
  kits,
  activeKit,
  onSelectKit,
  onCreateKit,
}) => {
  return (
    <header className="bg-adobe-panel border-b border-adobe-border px-3 py-2 text-adobe-text select-none">
      <div className="flex items-center justify-between mb-2 gap-1.5">
        <div className="flex items-center gap-1.5 font-bold text-sm text-white shrink-0">
          <ShieldCheck className="w-4 h-4 text-adobe-accent" />
          <span>Brand Guard</span>
        </div>

        <div className="flex items-center gap-1">
          <select
            value={activeKit?.id || ""}
            onChange={(e) => onSelectKit(e.target.value)}
            className="bg-adobe-bg border border-adobe-border text-xs rounded px-2 py-1 focus:outline-none focus:border-adobe-accent text-white max-w-[140px] truncate"
          >
            {kits.map((kit) => (
              <option key={kit.id} value={kit.id}>
                {kit.name} v{kit.version}
              </option>
            ))}
          </select>

          {onCreateKit && (
            <button
              onClick={onCreateKit}
              className="p-1 bg-adobe-bg hover:bg-adobe-border text-adobe-accent rounded transition-colors"
              title="Add new Brand"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex justify-between border-t border-adobe-border/50 pt-1.5 text-xs">
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            activeTab === "scan"
              ? "bg-adobe-accent text-white font-medium"
              : "text-adobe-muted hover:text-white"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Scan</span>
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            activeTab === "rules"
              ? "bg-adobe-accent text-white font-medium"
              : "text-adobe-muted hover:text-white"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Rules</span>
        </button>

        <button
          onClick={() => setActiveTab("kit")}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            activeTab === "kit"
              ? "bg-adobe-accent text-white font-medium"
              : "text-adobe-muted hover:text-white"
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Brand Kit</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            activeTab === "settings"
              ? "bg-adobe-accent text-white font-medium"
              : "text-adobe-muted hover:text-white"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </nav>
    </header>
  );
};

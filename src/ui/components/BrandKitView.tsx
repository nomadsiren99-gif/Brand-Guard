import React, { useState } from "react";
import { BrandKit, BrandColor } from "../../core/models/brandKit.js";
import { BrandKitImporter } from "../../kits/BrandKitImporter.js";
import { BrandKitExporter } from "../../kits/BrandKitExporter.js";
import { Palette, Download, Upload, Plus, Trash2, Edit3, Save } from "lucide-react";

interface BrandKitViewProps {
  activeKit: BrandKit | null;
  onSaveKit: (kit: BrandKit) => void;
  onCreateNewBrand: () => void;
  onDeleteBrand: (kitId: string) => void;
}

export const BrandKitView: React.FC<BrandKitViewProps> = ({
  activeKit,
  onSaveKit,
  onCreateNewBrand,
  onDeleteBrand,
}) => {
  const [activeTab, setActiveTab] = useState<"colors" | "typography" | "radii">("colors");
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#0066FF");
  const [editingBrandName, setEditingBrandName] = useState(false);
  const [brandNameInput, setBrandNameInput] = useState(activeKit?.name || "");

  const importer = new BrandKitImporter();
  const exporter = new BrandKitExporter();

  const handleExport = () => {
    if (!activeKit) return;
    const exportedStr = exporter.exportJson(activeKit);
    const blob = new Blob([exportedStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeKit.id || "brand-kit"}.brandguard.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = importer.importJson(content);
        onSaveKit(imported);
        alert(`Successfully imported ${imported.name} v${imported.version}`);
      } catch (err: any) {
        alert(err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleAddColor = () => {
    if (!activeKit || !newColorName.trim() || !newColorHex.trim()) return;

    const newColorToken: BrandColor = {
      id: `color-${Date.now()}`,
      name: newColorName.trim(),
      value: { hex: newColorHex.trim() },
      roles: ["custom"],
      tolerance: 3,
      autoFix: true,
    };

    const updatedKit: BrandKit = {
      ...activeKit,
      colors: [...activeKit.colors, newColorToken],
      metadata: {
        ...activeKit.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    onSaveKit(updatedKit);
    setNewColorName("");
  };

  const handleDeleteColor = (colorId: string) => {
    if (!activeKit) return;
    const updatedKit: BrandKit = {
      ...activeKit,
      colors: activeKit.colors.filter((c) => c.id !== colorId),
    };
    onSaveKit(updatedKit);
  };

  const handleUpdateBrandName = () => {
    if (!activeKit || !brandNameInput.trim()) return;
    const updatedKit: BrandKit = {
      ...activeKit,
      name: brandNameInput.trim(),
    };
    onSaveKit(updatedKit);
    setEditingBrandName(false);
  };

  if (!activeKit) {
    return (
      <div className="p-6 text-center text-adobe-muted">
        <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs mb-3">No active Brand Kit selected.</p>
        <button
          onClick={onCreateNewBrand}
          className="px-3 py-1.5 bg-adobe-accent text-white rounded text-xs font-semibold"
        >
          + Create Brand Slot
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 text-adobe-text select-none">
      {/* Header & Actions */}
      <div className="flex items-center justify-between mb-3 border-b border-adobe-border pb-2">
        <div>
          {editingBrandName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={brandNameInput}
                onChange={(e) => setBrandNameInput(e.target.value)}
                className="bg-adobe-bg border border-adobe-accent text-xs rounded px-1.5 py-0.5 text-white focus:outline-none"
              />
              <button onClick={handleUpdateBrandName} className="p-1 text-emerald-400">
                <Save className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-adobe-accent" />
              <span>{activeKit.name}</span>
              <button
                onClick={() => {
                  setBrandNameInput(activeKit.name);
                  setEditingBrandName(true);
                }}
                className="text-adobe-muted hover:text-white"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </h2>
          )}
          <span className="text-[10px] text-adobe-muted">Version {activeKit.version}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onCreateNewBrand}
            className="px-2 py-1 bg-adobe-accent hover:bg-adobe-accentHover text-white text-[11px] font-semibold rounded flex items-center gap-1 transition-colors"
            title="Create new brand slot (Brand 1, Brand 2...)"
          >
            <Plus className="w-3 h-3" />
            <span>New Brand</span>
          </button>

          <label className="cursor-pointer px-2 py-1 bg-adobe-panel hover:bg-adobe-border text-adobe-text text-[11px] rounded flex items-center gap-1 transition-colors">
            <Upload className="w-3 h-3" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={handleExport}
            className="px-2 py-1 bg-adobe-panel hover:bg-adobe-border text-adobe-text text-[11px] rounded flex items-center gap-1 transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="flex justify-between items-center mb-3 border-b border-adobe-border/50 text-xs">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("colors")}
            className={`px-3 py-1 font-medium border-b-2 transition-colors ${
              activeTab === "colors" ? "border-adobe-accent text-white" : "border-transparent text-adobe-muted"
            }`}
          >
            Colors ({activeKit.colors.length})
          </button>
          <button
            onClick={() => setActiveTab("typography")}
            className={`px-3 py-1 font-medium border-b-2 transition-colors ${
              activeTab === "typography" ? "border-adobe-accent text-white" : "border-transparent text-adobe-muted"
            }`}
          >
            Typography ({activeKit.typography.length})
          </button>
          <button
            onClick={() => setActiveTab("radii")}
            className={`px-3 py-1 font-medium border-b-2 transition-colors ${
              activeTab === "radii" ? "border-adobe-accent text-white" : "border-transparent text-adobe-muted"
            }`}
          >
            Radii ({activeKit.radii?.length || 0})
          </button>
        </div>

        <button
          onClick={() => onDeleteBrand(activeKit.id)}
          className="text-rose-400 hover:text-rose-300 p-1"
          title="Delete current Brand Kit"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Colors Tab */}
      {activeTab === "colors" && (
        <div>
          {/* Add New Color Form */}
          <div className="bg-adobe-panel border border-adobe-border rounded p-2 mb-3 flex items-center gap-1.5 text-xs">
            <input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              className="w-6 h-6 rounded bg-transparent border border-adobe-border cursor-pointer p-0 shrink-0"
            />
            <input
              type="text"
              placeholder="Color name (e.g. Primary Blue)"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              className="flex-1 bg-adobe-bg border border-adobe-border rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-adobe-accent"
            />
            <button
              onClick={handleAddColor}
              className="px-2.5 py-1 bg-adobe-accent hover:bg-adobe-accentHover text-white font-semibold rounded text-xs shrink-0"
            >
              Add
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {activeKit.colors.map((col) => (
              <div key={col.id} className="bg-adobe-panel border border-adobe-border rounded p-2 flex items-center justify-between gap-1 group">
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-5 h-5 rounded border border-adobe-border shrink-0 shadow-inner"
                    style={{ backgroundColor: col.value.hex || "#000" }}
                  />
                  <div className="truncate text-xs">
                    <div className="font-semibold text-white truncate">{col.name}</div>
                    <div className="font-mono text-[10px] text-adobe-muted">{col.value.hex}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteColor(col.id)}
                  className="text-adobe-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Typography Tab */}
      {activeTab === "typography" && (
        <div className="space-y-2 text-xs">
          {activeKit.typography.map((typo) => (
            <div key={typo.id} className="bg-adobe-panel border border-adobe-border rounded p-2.5">
              <div className="font-bold text-white mb-1">{typo.name}</div>
              <div className="text-adobe-muted text-[11px]">
                <div>Fonts: <span className="text-white">{typo.fontFamilies.join(", ")}</span></div>
                <div>Weights: <span className="text-white">{typo.fontWeights?.join(", ") || "Any"}</span></div>
                <div>Sizes: <span className="text-white">{typo.sizes?.join("px, ") + "px" || "Any"}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Radii Tab */}
      {activeTab === "radii" && (
        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          {activeKit.radii?.map((r, idx) => (
            <div key={idx} className="bg-adobe-panel border border-adobe-border rounded p-2">
              <div className="font-bold text-white">{r.value}px</div>
              <div className="text-[10px] text-adobe-muted">{r.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

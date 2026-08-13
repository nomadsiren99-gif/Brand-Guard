import React, { useState, useEffect } from "react";
import { PanelHeader, NavTab } from "./components/PanelHeader";
import { ScanDashboard } from "./components/ScanDashboard";
import { RulesView } from "./components/RulesView";
import { BrandKitView } from "./components/BrandKitView";
import { SettingsView } from "./components/SettingsView";

import { BrandKit } from "../core/models/brandKit";
import { NormalizedDocument } from "../core/models/document";
import { BrandIssue } from "../core/models/issues";

import { LocalStorageAdapter } from "../storage/StorageAdapter";
import { BrandKitStore } from "../kits/BrandKitStore";
import { RuleRegistry } from "../core/rules/RuleRegistry";
import { RuleRunner } from "../core/rules/RuleRunner";
import { IssueStore } from "../core/issues/IssueStore";
import { IgnoreStore } from "../core/ignore/IgnoreStore";
import { ComplianceScoreService } from "../core/score/ComplianceScoreService";
import { ScanController } from "../core/scanner/ScanController";
import { createHostAdapter } from "../hosts/createHostAdapter";
import { demoDocument } from "../core/fixtures/demoDocument";
import acmeBrand from "../../examples/acme-brand.brandguard.json";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("scan");
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [activeKit, setActiveKit] = useState<BrandKit | null>(null);

  const [document, setDocument] = useState<NormalizedDocument | null>(demoDocument);
  const [score, setScore] = useState<number>(100);
  const [issues, setIssues] = useState<BrandIssue[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Singletons with LocalStorage persistence memory
  const [storage] = useState(() => new LocalStorageAdapter());
  const [kitStore] = useState(() => new BrandKitStore(storage));
  const [ruleRegistry] = useState(() => new RuleRegistry());
  const [ruleRunner] = useState(() => new RuleRunner());
  const [issueStore] = useState(() => new IssueStore());
  const [ignoreStore] = useState(() => new IgnoreStore());
  const [scoreService] = useState(() => new ComplianceScoreService());
  const [scanController] = useState(
    () => new ScanController(ruleRegistry, ruleRunner, issueStore, ignoreStore, scoreService)
  );
  const [hostAdapter] = useState(() => createHostAdapter());

  useEffect(() => {
    async function init() {
      await hostAdapter.initialize();
      await kitStore.loadFromStorage();

      // If storage is empty, initialize default Acme Brand
      if (kitStore.getAllKits().length === 0) {
        const defaultKit = acmeBrand as unknown as BrandKit;
        await kitStore.saveKit(defaultKit);
      }

      setKits(kitStore.getAllKits());
      setActiveKit(kitStore.getActiveKit());

      // Try reading the active host document if in a UXP environment
      const activeDoc = await hostAdapter.getActiveDocument();
      if (activeDoc) {
        setDocument(activeDoc);
      }
    }
    init();
  }, []);

  const handleScan = async () => {
    if (!activeKit) return;
    setIsScanning(true);
    setScanProgress(20);

    const docToScan = (await hostAdapter.getActiveDocument()) || document || demoDocument;
    setDocument(docToScan);

    const result = await scanController.scanDocument(docToScan, activeKit);

    setIssues([...result.issues]);
    setScore(result.score);
    setScanProgress(100);
    setIsScanning(false);
  };

  const handleSelectKit = async (kitId: string) => {
    await kitStore.setActiveKit(kitId);
    setActiveKit(kitStore.getActiveKit());
  };

  const handleCreateNewBrand = async () => {
    const newKit = await kitStore.createNewBrandKit();
    setKits(kitStore.getAllKits());
    setActiveKit(newKit);
    setActiveTab("kit");
  };

  const handleDeleteBrand = async (kitId: string) => {
    try {
      await kitStore.deleteKit(kitId);
      setKits(kitStore.getAllKits());
      setActiveKit(kitStore.getActiveKit());
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSelectNode = async (hostId: string) => {
    await hostAdapter.selectNode(hostId);
  };

  const handleFixIssue = async (issue: BrandIssue) => {
    if (!issue.fix) return;
    const res = await hostAdapter.applyFix(issue.fix);
    if (res.success) {
      issueStore.markFixed(issue.id);
      setIssues(issueStore.getIssues());
      setScore(scoreService.calculateScore(issueStore.getIssues(), document?.nodes.length || 1));
    } else {
      alert(`Fix failed: ${res.message}`);
    }
  };

  const handleFixAllSafe = async (safeIssues: BrandIssue[]) => {
    for (const issue of safeIssues) {
      if (issue.fix) {
        const res = await hostAdapter.applyFix(issue.fix);
        if (res.success) {
          issueStore.markFixed(issue.id);
        }
      }
    }
    setIssues(issueStore.getIssues());
    setScore(scoreService.calculateScore(issueStore.getIssues(), document?.nodes.length || 1));
  };

  const handleIgnoreIssue = (issueId: string, ruleId: string, nodeId?: string) => {
    ignoreStore.addIgnore({
      id: issueId,
      kitId: activeKit?.id || "default",
      ruleId,
      nodeFingerprint: nodeId,
      scope: "node-rule",
      createdAt: new Date().toISOString(),
    });
    issueStore.markIgnored(issueId);
    setIssues(issueStore.getIssues());
    setScore(scoreService.calculateScore(issueStore.getIssues(), document?.nodes.length || 1));
  };

  const handleSaveKit = async (kit: BrandKit) => {
    await kitStore.saveKit(kit);
    setKits(kitStore.getAllKits());
    setActiveKit(kitStore.getActiveKit());
  };

  return (
    <div className="min-h-screen bg-adobe-bg text-adobe-text flex flex-col font-sans">
      <PanelHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        kits={kits}
        activeKit={activeKit}
        onSelectKit={handleSelectKit}
        onCreateKit={handleCreateNewBrand}
      />

      <main className="flex-1 overflow-y-auto">
        {activeTab === "scan" && (
          <ScanDashboard
            document={document}
            score={score}
            issues={issues}
            isScanning={isScanning}
            scanProgress={scanProgress}
            onScan={handleScan}
            onSelectNode={handleSelectNode}
            onFixIssue={handleFixIssue}
            onFixAllSafe={handleFixAllSafe}
            onIgnoreIssue={handleIgnoreIssue}
          />
        )}

        {activeTab === "rules" && <RulesView ruleRegistry={ruleRegistry} />}

        {activeTab === "kit" && (
          <BrandKitView
            activeKit={activeKit}
            onSaveKit={handleSaveKit}
            onCreateNewBrand={handleCreateNewBrand}
            onDeleteBrand={handleDeleteBrand}
          />
        )}

        {activeTab === "settings" && <SettingsView />}
      </main>
    </div>
  );
};

export default App;

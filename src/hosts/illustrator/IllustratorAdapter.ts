import { HostAdapter, HostCapabilities } from "../HostAdapter.js";
import { NormalizedDocument } from "../../core/models/document.js";
import { FixInstruction } from "../../core/models/issues.js";
import { FixResult } from "../../core/models/rules.js";
import { IllustratorDocumentReader } from "./IllustratorDocumentReader.js";
import { IllustratorSelectionService } from "./IllustratorSelectionService.js";
import { IllustratorFixService } from "./IllustratorFixService.js";

export class IllustratorAdapter implements HostAdapter {
  host = "illustrator" as const;

  capabilities: HostCapabilities = {
    readColor: true,
    writeColor: true,
    readTypography: true,
    writeTypography: true,
    readRadius: true,
    writeRadius: false,
    readEffects: true,
    writeEffects: false,
    detectLogo: true,
    documentEvents: false,
  };

  private reader = new IllustratorDocumentReader();
  private selectionService = new IllustratorSelectionService();
  private fixService = new IllustratorFixService();

  async initialize(): Promise<void> {
    console.log("[IllustratorAdapter] Initialized.");
  }

  async getActiveDocument(): Promise<NormalizedDocument | null> {
    if (typeof window !== "undefined" && (window as any).require) {
      try {
        const illustrator = (window as any).require("illustrator");
        if (illustrator && illustrator.activeDocument) {
          return this.reader.read(illustrator.activeDocument);
        }
      } catch (err) {
        console.warn("[IllustratorAdapter] Could not read active Illustrator document:", err);
      }
    }
    return null;
  }

  async selectNode(hostId: string): Promise<void> {
    await this.selectionService.selectItem(hostId);
  }

  async revealNode(hostId: string): Promise<void> {
    await this.selectionService.selectItem(hostId);
  }

  async applyFix(fix: FixInstruction): Promise<FixResult> {
    return await this.fixService.applyFix(fix);
  }
}

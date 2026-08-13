import { HostAdapter, HostCapabilities } from "../HostAdapter.js";
import { NormalizedDocument } from "../../core/models/document.js";
import { FixInstruction } from "../../core/models/issues.js";
import { FixResult } from "../../core/models/rules.js";
import { IllustratorDocumentReader } from "./IllustratorDocumentReader.js";
import { IllustratorSelectionService, getIllustratorModule } from "./IllustratorSelectionService.js";
import { IllustratorFixService } from "./IllustratorFixService.js";

export class IllustratorAdapter implements HostAdapter {
  host = "illustrator" as const;

  capabilities: HostCapabilities = {
    readColor: true,
    writeColor: true,
    readTypography: true,
    writeTypography: true,
    // Corner radius lives on live-shape plugin attributes that the public
    // Illustrator scripting API does not expose.
    readRadius: false,
    writeRadius: false,
    readEffects: false,
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
    const illustrator = getIllustratorModule();
    if (illustrator) {
      try {
        const doc = illustrator.app?.activeDocument;
        if (doc) {
          return this.reader.read(doc);
        }
      } catch (err) {
        console.warn("[IllustratorAdapter] Could not read active Illustrator document from UXP:", err);
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

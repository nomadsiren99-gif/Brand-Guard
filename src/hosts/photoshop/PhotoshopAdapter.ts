import { HostAdapter, HostCapabilities } from "../HostAdapter.js";
import { NormalizedDocument } from "../../core/models/document.js";
import { FixInstruction } from "../../core/models/issues.js";
import { FixResult } from "../../core/models/rules.js";
import { PhotoshopDocumentReader } from "./PhotoshopDocumentReader.js";
import { PhotoshopSelectionService } from "./PhotoshopSelectionService.js";
import { PhotoshopFixService } from "./PhotoshopFixService.js";

export class PhotoshopAdapter implements HostAdapter {
  host = "photoshop" as const;

  capabilities: HostCapabilities = {
    readColor: true,
    writeColor: true,
    readTypography: true,
    writeTypography: true,
    readRadius: true,
    writeRadius: true,
    readEffects: true,
    writeEffects: true,
    detectLogo: true,
    documentEvents: true,
  };

  private reader = new PhotoshopDocumentReader();
  private selectionService = new PhotoshopSelectionService();
  private fixService = new PhotoshopFixService();

  async initialize(): Promise<void> {
    console.log("[PhotoshopAdapter] Initialized.");
  }

  async getActiveDocument(): Promise<NormalizedDocument | null> {
    // Check if running inside Photoshop UXP DOM environment
    if (typeof window !== "undefined" && (window as any).require) {
      try {
        const { app } = (window as any).require("photoshop");
        if (app.activeDocument) {
          return this.reader.read(app.activeDocument);
        }
      } catch (err) {
        console.warn("[PhotoshopAdapter] Could not read active Photoshop document from UXP:", err);
      }
    }
    return null;
  }

  async selectNode(hostId: string): Promise<void> {
    await this.selectionService.selectLayer(hostId);
  }

  async revealNode(hostId: string): Promise<void> {
    await this.selectionService.selectLayer(hostId);
  }

  async applyFix(fix: FixInstruction): Promise<FixResult> {
    return await this.fixService.applyFix(fix);
  }
}

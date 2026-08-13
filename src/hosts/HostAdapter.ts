import { NormalizedDocument } from "../core/models/document.js";
import { FixInstruction } from "../core/models/issues.js";
import { FixResult } from "../core/models/rules.js";

export interface HostCapabilities {
  readColor: boolean;
  writeColor: boolean;
  readTypography: boolean;
  writeTypography: boolean;
  readRadius: boolean;
  writeRadius: boolean;
  readEffects: boolean;
  writeEffects: boolean;
  detectLogo: boolean;
  documentEvents: boolean;
}

export interface HostAdapter {
  host: "photoshop" | "illustrator";
  capabilities: HostCapabilities;

  initialize(): Promise<void>;
  getActiveDocument(): Promise<NormalizedDocument | null>;
  selectNode(hostId: string): Promise<void>;
  revealNode(hostId: string): Promise<void>;
  applyFix(fix: FixInstruction): Promise<FixResult>;
  watchDocument?(callback: (event: any) => void): () => void;
}

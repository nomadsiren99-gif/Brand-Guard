import { HostAdapter } from "./HostAdapter.js";
import { PhotoshopAdapter } from "./photoshop/PhotoshopAdapter.js";
import { IllustratorAdapter } from "./illustrator/IllustratorAdapter.js";

export type HostName = "photoshop" | "illustrator";

/**
 * Detects which Adobe host the panel is running inside.
 *
 * UXP exposes the host application through `require("uxp").host.name`. When the
 * panel runs in a plain browser (dev server, tests) there is no host, and we
 * fall back to Photoshop so the demo document still renders.
 */
export function detectHost(): HostName {
  if (typeof window !== "undefined" && (window as any).require) {
    const req = (window as any).require;

    try {
      const hostName = req("uxp")?.host?.name;
      if (typeof hostName === "string") {
        const normalized = hostName.toLowerCase();
        if (normalized.includes("illustrator")) return "illustrator";
        if (normalized.includes("photoshop")) return "photoshop";
      }
    } catch {
      // uxp module unavailable; fall through to probing the host modules.
    }

    try {
      if (req("illustrator")?.app) return "illustrator";
    } catch {
      // not Illustrator
    }

    try {
      if (req("photoshop")?.app) return "photoshop";
    } catch {
      // not Photoshop
    }
  }

  return "photoshop";
}

export function createHostAdapter(host: HostName = detectHost()): HostAdapter {
  return host === "illustrator" ? new IllustratorAdapter() : new PhotoshopAdapter();
}

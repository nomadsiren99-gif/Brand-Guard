import { HostAdapter } from "./HostAdapter.js";
import { PhotoshopAdapter } from "./photoshop/PhotoshopAdapter.js";
import { IllustratorAdapter } from "./illustrator/IllustratorAdapter.js";

export class HostAdapterFactory {
  static getAdapter(): HostAdapter {
    if (typeof window !== "undefined" && (window as any).require) {
      try {
        // Try Photoshop UXP require
        const ps = (window as any).require("photoshop");
        if (ps) return new PhotoshopAdapter();
      } catch {}

      try {
        // Try Illustrator UXP require
        const ai = (window as any).require("illustrator");
        if (ai) return new IllustratorAdapter();
      } catch {}
    }

    // Default to PhotoshopAdapter for stand-alone development & testing
    return new PhotoshopAdapter();
  }
}

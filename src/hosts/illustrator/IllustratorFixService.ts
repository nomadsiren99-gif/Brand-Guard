import { FixInstruction } from "../../core/models/issues.js";
import { FixResult } from "../../core/models/rules.js";
import { hexToRgb } from "../../core/color/colorNormalization.js";

export class IllustratorFixService {
  async applyFix(fix: FixInstruction): Promise<FixResult> {
    if (!fix || !fix.nodeId) {
      return { success: false, message: "Invalid fix instruction payload" };
    }

    const isUxp = typeof window !== "undefined" && (window as any).require;

    try {
      switch (fix.type) {
        case "replaceColor": {
          const hex = fix.payload.color as string;
          const rgb = hexToRgb(hex);
          if (!rgb) return { success: false, message: `Invalid target hex ${hex}` };

          if (isUxp) {
            const illustrator = (window as any).require("illustrator");
            const doc = illustrator?.activeDocument;
            const item = doc?.pageItems?.getByName(fix.nodeId);
            if (item && item.fillColor) {
              const newColor = new illustrator.RGBColor();
              newColor.red = rgb.r;
              newColor.green = rgb.g;
              newColor.blue = rgb.b;
              item.fillColor = newColor;
            }
          }
          return { success: true, message: `Replaced Illustrator fill color with ${hex}` };
        }

        case "replaceFont": {
          const fontFamily = fix.payload.fontFamily as string;
          if (isUxp) {
            const illustrator = (window as any).require("illustrator");
            const doc = illustrator?.activeDocument;
            const item = doc?.pageItems?.getByName(fix.nodeId);
            if (item && item.textRange) {
              item.textRange.font = fontFamily;
            }
          }
          return { success: true, message: `Replaced Illustrator font with ${fontFamily}` };
        }

        case "setOpacity": {
          const opacityVal = (fix.payload.opacity as number) * 100;
          if (isUxp) {
            const illustrator = (window as any).require("illustrator");
            const doc = illustrator?.activeDocument;
            const item = doc?.pageItems?.getByName(fix.nodeId);
            if (item) {
              item.opacity = opacityVal;
            }
          }
          return { success: true, message: `Updated opacity to ${opacityVal}%` };
        }

        case "rename": {
          const newName = fix.payload.name as string;
          if (isUxp) {
            const illustrator = (window as any).require("illustrator");
            const doc = illustrator?.activeDocument;
            const item = doc?.pageItems?.getByName(fix.nodeId);
            if (item) {
              item.name = newName;
            }
          }
          return { success: true, message: `Renamed Illustrator item to ${newName}` };
        }

        default:
          return { success: false, message: `Fix type ${fix.type} not supported on Illustrator yet.` };
      }
    } catch (err: any) {
      return { success: false, message: `Illustrator fix failed: ${err.message || String(err)}`, error: err };
    }
  }
}

import { FixInstruction } from "../../core/models/issues.js";
import { FixResult } from "../../core/models/rules.js";
import { hexToRgb } from "../../core/color/colorNormalization.js";
import { getIllustratorModule, findPageItemById } from "./IllustratorSelectionService.js";

/**
 * Applies fixes through the Illustrator DOM scripting API. Unlike Photoshop,
 * Illustrator UXP has no batchPlay, so properties are set on page items directly.
 */
export class IllustratorFixService {
  async applyFix(fix: FixInstruction): Promise<FixResult> {
    if (!fix || !fix.nodeId) {
      return { success: false, message: "Invalid fix instruction payload" };
    }

    const illustrator = getIllustratorModule();
    const doc = illustrator?.app?.activeDocument;
    const item = doc ? findPageItemById(doc.pageItems, fix.nodeId) : null;

    if (illustrator && !item) {
      return { success: false, message: `No Illustrator item found for node ${fix.nodeId}` };
    }

    try {
      switch (fix.type) {
        case "replaceColor": {
          const hex = fix.payload.color as string;
          const rgb = hexToRgb(hex);
          if (!rgb) return { success: false, message: `Invalid target hex ${hex}` };

          if (item) {
            const color = new illustrator.RGBColor();
            color.red = rgb.r;
            color.green = rgb.g;
            color.blue = rgb.b;
            const attrs = item.textRange?.characterAttributes;
            if (item.typename === "TextFrame" && attrs) {
              attrs.fillColor = color;
            } else {
              item.fillColor = color;
            }
          }
          return { success: true, message: `Replaced color with ${hex}` };
        }

        case "replaceFont": {
          const fontFamily = fix.payload.fontFamily as string;
          if (item) {
            const attrs = item.textRange?.characterAttributes;
            if (!attrs) {
              return { success: false, message: `Node ${fix.nodeId} has no editable text range` };
            }
            attrs.textFont = illustrator.app.textFonts.getByName(fontFamily);
          }
          return { success: true, message: `Replaced font with ${fontFamily}` };
        }

        case "setFontSize": {
          const fontSize = fix.payload.fontSize as number;
          if (item) {
            const attrs = item.textRange?.characterAttributes;
            if (!attrs) {
              return { success: false, message: `Node ${fix.nodeId} has no editable text range` };
            }
            attrs.size = fontSize;
          }
          return { success: true, message: `Set font size to ${fontSize}px` };
        }

        case "setStroke": {
          const strokeWidth = fix.payload.strokeWidth as number;
          if (item) {
            item.strokeWidth = strokeWidth;
          }
          return { success: true, message: `Set stroke width to ${strokeWidth}px` };
        }

        case "setOpacity": {
          const opacityVal = (fix.payload.opacity as number) * 100;
          if (item) {
            item.opacity = opacityVal;
          }
          return { success: true, message: `Updated opacity to ${opacityVal}%` };
        }

        case "setPosition": {
          const { x, y } = fix.payload as { x?: number; y?: number };
          if (item) {
            if (x !== undefined) item.left = x;
            // Illustrator's Y axis points up, so invert the normalized value.
            if (y !== undefined) item.top = -y;
          }
          return { success: true, message: `Repositioned to (${x ?? "-"}, ${y ?? "-"})` };
        }

        case "resize": {
          const { width, height } = fix.payload as { width?: number; height?: number };
          if (item) {
            if (width !== undefined) item.width = width;
            if (height !== undefined) item.height = height;
          }
          return { success: true, message: `Resized to ${width ?? "-"}x${height ?? "-"}px` };
        }

        case "rename": {
          const newName = fix.payload.name as string;
          if (item) {
            item.name = newName;
          }
          return { success: true, message: `Renamed item to ${newName}` };
        }

        default:
          return { success: false, message: `Fix type ${fix.type} not yet implemented` };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Illustrator fix failed: ${err?.message || String(err)}`,
        error: err,
      };
    }
  }
}

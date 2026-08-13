import { FixInstruction } from "../../core/models/issues.js";
import { FixResult } from "../../core/models/rules.js";
import { hexToRgb } from "../../core/color/colorNormalization.js";

export class PhotoshopFixService {
  async applyFix(fix: FixInstruction): Promise<FixResult> {
    if (!fix || !fix.nodeId) {
      return { success: false, message: "Invalid fix instruction payload" };
    }

    // Check UXP runtime
    const isUxp = typeof window !== "undefined" && (window as any).require;

    try {
      switch (fix.type) {
        case "replaceColor": {
          const hex = fix.payload.color as string;
          const rgb = hexToRgb(hex);
          if (!rgb) return { success: false, message: `Invalid target hex ${hex}` };

          if (isUxp) {
            const { action } = (window as any).require("photoshop");
            await action.batchPlay(
              [
                {
                  _obj: "set",
                  _target: [{ _ref: "contentLayer", _enum: "ordinal", _value: "targetEnum" }],
                  to: {
                    _obj: "solidColorLayer",
                    color: { _obj: "RGBColor", red: rgb.r, green: rgb.g, blue: rgb.b },
                  },
                },
              ],
              {}
            );
          }
          return { success: true, message: `Replaced color with ${hex}` };
        }

        case "replaceFont": {
          const fontFamily = fix.payload.fontFamily as string;
          if (isUxp) {
            const { action } = (window as any).require("photoshop");
            await action.batchPlay(
              [
                {
                  _obj: "set",
                  _target: [{ _ref: "property", _property: "textKey" }, { _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
                  to: { _obj: "textLayer", fontPostScriptName: fontFamily },
                },
              ],
              {}
            );
          }
          return { success: true, message: `Replaced font with ${fontFamily}` };
        }

        case "setOpacity": {
          const opacityVal = (fix.payload.opacity as number) * 100;
          if (isUxp) {
            const { action } = (window as any).require("photoshop");
            await action.batchPlay(
              [
                {
                  _obj: "set",
                  _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
                  to: { _obj: "layer", opacity: { _unit: "percentUnit", _value: opacityVal } },
                },
              ],
              {}
            );
          }
          return { success: true, message: `Updated opacity to ${opacityVal}%` };
        }

        case "rename": {
          const newName = fix.payload.name as string;
          if (isUxp) {
            const { action } = (window as any).require("photoshop");
            await action.batchPlay(
              [
                {
                  _obj: "set",
                  _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
                  to: { _obj: "layer", name: newName },
                },
              ],
              {}
            );
          }
          return { success: true, message: `Renamed layer to ${newName}` };
        }

        default:
          return { success: false, message: `Fix type ${fix.type} not yet implemented` };
      }
    } catch (err: any) {
      return { success: false, message: `Photoshop fix failed: ${err.message || String(err)}`, error: err };
    }
  }
}

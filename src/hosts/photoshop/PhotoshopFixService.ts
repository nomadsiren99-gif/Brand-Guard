import { FixInstruction } from "../../core/models/issues.js";
import { FixResult } from "../../core/models/rules.js";
import { hexToRgb } from "../../core/color/colorNormalization.js";

export class PhotoshopFixService {
  async applyFix(fix: FixInstruction): Promise<FixResult> {
    if (!fix || !fix.nodeId) {
      return { success: false, message: "Invalid fix instruction payload" };
    }

    const isUxp = typeof window !== "undefined" && (window as any).require;

    try {
      if (isUxp) {
        const photoshop = (window as any).require("photoshop");
        const { action, core } = photoshop;

        // Adobe Photoshop UXP v23+ requires executing document changes inside executeAsModal
        const executeFix = async () => {
          const layerId = parseInt(fix.nodeId, 10);
          
          // 1. Select the target layer by ID if layerId is numeric
          if (!isNaN(layerId)) {
            await action.batchPlay(
              [
                {
                  _obj: "select",
                  _target: [{ _ref: "layer", _id: layerId }],
                  makeVisible: false,
                },
              ],
              {}
            );
          }

          // 2. Perform fix mutation
          switch (fix.type) {
            case "replaceColor": {
              const hex = fix.payload.color as string;
              const rgb = hexToRgb(hex);
              if (!rgb) throw new Error(`Invalid target hex ${hex}`);

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
              break;
            }

            case "replaceFont": {
              const fontFamily = fix.payload.fontFamily as string;
              await action.batchPlay(
                [
                  {
                    _obj: "set",
                    _target: [
                      { _ref: "property", _property: "textKey" },
                      { _ref: "layer", _enum: "ordinal", _value: "targetEnum" },
                    ],
                    to: { _obj: "textLayer", fontPostScriptName: fontFamily },
                  },
                ],
                {}
              );
              break;
            }

            case "setOpacity": {
              const opacityVal = (fix.payload.opacity as number) * 100;
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
              break;
            }

            case "rename": {
              const newName = fix.payload.name as string;
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
              break;
            }

            default:
              throw new Error(`Fix type ${fix.type} not supported.`);
          }
        };

        if (core && typeof core.executeAsModal === "function") {
          await core.executeAsModal(executeFix, { commandName: `Brand Guard: ${fix.type}` });
        } else {
          await executeFix();
        }
      }

      return { success: true, message: `Successfully applied ${fix.type}` };
    } catch (err: any) {
      console.error("[PhotoshopFixService] Error executing UXP fix:", err);
      return {
        success: false,
        message: `Photoshop fix failed: ${err.message || String(err)}`,
        error: err,
      };
    }
  }
}

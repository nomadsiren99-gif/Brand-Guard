import { BrandKit } from "../core/models/brandKit.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class BrandKitValidator {
  validate(kit: any): ValidationResult {
    const errors: string[] = [];

    if (!kit || typeof kit !== "object") {
      return { valid: false, errors: ["Brand kit must be a valid JSON object."] };
    }

    if (!kit.id || typeof kit.id !== "string") {
      errors.push("Brand kit missing required field 'id' (string).");
    }

    if (!kit.name || typeof kit.name !== "string") {
      errors.push("Brand kit missing required field 'name' (string).");
    }

    if (!kit.version || typeof kit.version !== "string") {
      errors.push("Brand kit missing required field 'version' (string).");
    }

    if (!Array.isArray(kit.colors)) {
      errors.push("Brand kit field 'colors' must be an array.");
    } else {
      const colorIds = new Set<string>();
      kit.colors.forEach((col: any, idx: number) => {
        if (!col.id || typeof col.id !== "string") {
          errors.push(`Color at index ${idx} missing 'id'.`);
        } else if (colorIds.has(col.id)) {
          errors.push(`Duplicate color token ID '${col.id}'.`);
        } else {
          colorIds.add(col.id);
        }

        if (!col.value?.hex || typeof col.value.hex !== "string") {
          errors.push(`Color '${col.name || col.id || idx}' missing valid HEX value.`);
        } else if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(col.value.hex)) {
          errors.push(`Color '${col.name || col.id}' contains invalid HEX '${col.value.hex}'.`);
        }
      });
    }

    if (!Array.isArray(kit.typography)) {
      errors.push("Brand kit field 'typography' must be an array.");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

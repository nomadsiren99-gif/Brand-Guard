import { BrandKit } from "../core/models/brandKit.js";
import { BrandKitValidator } from "./BrandKitValidator.js";

export class BrandKitImporter {
  private validator = new BrandKitValidator();

  importJson(jsonString: string): BrandKit {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e: any) {
      throw new Error(`Invalid JSON syntax: ${e.message}`);
    }

    const validation = this.validator.validate(parsed);
    if (!validation.valid) {
      throw new Error(`Could not import Brand Kit:\n- ${validation.errors.join("\n- ")}`);
    }

    return parsed as BrandKit;
  }
}

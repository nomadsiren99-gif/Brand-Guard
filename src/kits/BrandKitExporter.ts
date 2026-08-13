import { BrandKit } from "../core/models/brandKit.js";

export class BrandKitExporter {
  exportJson(kit: BrandKit): string {
    const exportable = {
      schemaVersion: 1,
      ...kit,
      metadata: {
        ...kit.metadata,
        exportedAt: new Date().toISOString(),
      },
    };

    return JSON.stringify(exportable, null, 2);
  }
}

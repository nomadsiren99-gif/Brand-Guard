import { describe, it, expect, beforeEach } from "vitest";
import { BrandKitImporter } from "../../src/kits/BrandKitImporter.js";
import { BrandKitExporter } from "../../src/kits/BrandKitExporter.js";
import { BrandKitStore } from "../../src/kits/BrandKitStore.js";
import { InMemoryStorageAdapter } from "../../src/storage/StorageAdapter.js";
import acmeBrand from "../../examples/acme-brand.brandguard.json" assert { type: "json" };
import { BrandKit } from "../../src/core/models/brandKit.js";

describe("Brand Kit Store & Import/Export (Milestone 2)", () => {
  let importer: BrandKitImporter;
  let exporter: BrandKitExporter;
  let store: BrandKitStore;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    importer = new BrandKitImporter();
    exporter = new BrandKitExporter();
    storage = new InMemoryStorageAdapter();
    store = new BrandKitStore(storage);
  });

  it("should import valid Brand Kit JSON successfully", () => {
    const jsonStr = JSON.stringify(acmeBrand);
    const kit = importer.importJson(jsonStr);
    expect(kit.id).toBe("acme-main");
    expect(kit.colors.length).toBe(4);
  });

  it("should reject invalid Brand Kit JSON with human-readable errors", () => {
    const invalidKit = {
      id: "test",
      name: "Bad Kit",
      version: "1.0",
      colors: [
        { id: "col1", name: "Bad Hex", value: { hex: "#00ZZFF" } },
      ],
      typography: [],
    };

    expect(() => importer.importJson(JSON.stringify(invalidKit))).toThrowError(
      /invalid HEX '#00ZZFF'/
    );
  });

  it("should export Brand Kit and allow re-importing", async () => {
    const kit = acmeBrand as unknown as BrandKit;
    const exportedStr = exporter.exportJson(kit);
    const reimported = importer.importJson(exportedStr);

    expect(reimported.id).toBe(kit.id);
    expect(reimported.colors.length).toBe(kit.colors.length);

    await store.saveKit(reimported);
    expect(store.getActiveKit()?.id).toBe(kit.id);
  });
});

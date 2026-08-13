import { describe, it, expect, beforeEach } from "vitest";
import { BrandKitStore } from "../../src/kits/BrandKitStore.js";
import { LocalStorageAdapter, InMemoryStorageAdapter } from "../../src/storage/StorageAdapter.js";
import acmeBrand from "../../examples/acme-brand.brandguard.json" assert { type: "json" };
import { BrandKit } from "../../src/core/models/brandKit.js";

describe("Multi-Brand Memory Feature", () => {
  let store: BrandKitStore;
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    store = new BrandKitStore(storage);
  });

  it("should create multiple brand slots (Brand 1, Brand 2, Brand 3) and save parameters", async () => {
    await store.saveKit(acmeBrand as unknown as BrandKit);

    // Create Brand 2
    const brand2 = await store.createNewBrandKit();
    expect(brand2.name).toBe("Brand 2");

    // Create Brand 3
    const brand3 = await store.createNewBrandKit();
    expect(brand3.name).toBe("Brand 3");

    expect(store.getAllKits().length).toBe(3);
    expect(store.getActiveKit()?.id).toBe(brand3.id);

    // Switch back to Brand 1 (Acme Brand)
    await store.setActiveKit("acme-main");
    expect(store.getActiveKit()?.id).toBe("acme-main");
  });

  it("should persist brand parameters across reloads", async () => {
    await store.saveKit(acmeBrand as unknown as BrandKit);
    const brand2 = await store.createNewBrandKit();

    // Re-instantiate new store with same storage engine (simulating app restart)
    const newStoreSession = new BrandKitStore(storage);
    await newStoreSession.loadFromStorage();

    expect(newStoreSession.getAllKits().length).toBe(2);
    expect(newStoreSession.getActiveKit()?.id).toBe(brand2.id);
  });
});

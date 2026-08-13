import { BrandKit } from "../core/models/brandKit.js";
import { StorageAdapter } from "../storage/StorageAdapter.js";

export class BrandKitStore {
  private activeKit: BrandKit | null = null;
  private kits: Map<string, BrandKit> = new Map();
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  async loadFromStorage(): Promise<void> {
    const savedKits = await this.storage.get<BrandKit[]>("brand_guard_kits");
    if (savedKits && Array.isArray(savedKits) && savedKits.length > 0) {
      this.kits.clear();
      savedKits.forEach((kit) => this.kits.set(kit.id, kit));
    }

    const activeId = await this.storage.get<string>("brand_guard_active_kit_id");
    if (activeId && this.kits.has(activeId)) {
      this.activeKit = this.kits.get(activeId) || null;
    } else if (this.kits.size > 0) {
      this.activeKit = Array.from(this.kits.values())[0];
    }
  }

  async createNewBrandKit(): Promise<BrandKit> {
    const count = this.kits.size + 1;
    const newKit: BrandKit = {
      id: `brand-${Date.now()}`,
      name: `Brand ${count}`,
      version: "1.0.0",
      description: `Custom Brand ${count} Guidelines`,
      colors: [
        {
          id: `color-${Date.now()}-1`,
          name: "Primary Blue",
          value: { hex: "#0066FF" },
          roles: ["primary"],
          tolerance: 3,
          autoFix: true,
        },
        {
          id: `color-${Date.now()}-2`,
          name: "Secondary Dark",
          value: { hex: "#1A1A1A" },
          roles: ["dark"],
          tolerance: 3,
          autoFix: true,
        },
      ],
      typography: [
        {
          id: `type-${Date.now()}-1`,
          name: "Primary Fonts",
          fontFamilies: ["Helvetica Neue", "Arial"],
          fontWeights: ["Regular", "Bold"],
          sizes: [14, 16, 24, 32],
          minSize: 12,
        },
      ],
      radii: [
        { name: "Small", value: 4 },
        { name: "Medium", "value": 8 },
        { name: "Large", value: 16 },
      ],
      strokes: [
        { name: "Thin", width: 1 },
        { name: "Thick", width: 3 },
      ],
      approvedOpacities: [0.25, 0.5, 0.75, 1.0],
      layerNaming: {
        enabled: true,
        patterns: ["^[a-z][a-z0-9-]*$"],
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    await this.saveKit(newKit);
    await this.setActiveKit(newKit.id);
    return newKit;
  }

  async deleteKit(kitId: string): Promise<void> {
    if (this.kits.size <= 1) {
      throw new Error("Cannot delete the last remaining Brand Kit.");
    }
    this.kits.delete(kitId);
    if (this.activeKit?.id === kitId) {
      this.activeKit = Array.from(this.kits.values())[0] || null;
    }
    await this.persist();
  }

  async saveKit(kit: BrandKit): Promise<void> {
    this.kits.set(kit.id, kit);
    if (!this.activeKit) {
      this.activeKit = kit;
    } else if (this.activeKit.id === kit.id) {
      this.activeKit = kit;
    }
    await this.persist();
  }

  async setActiveKit(kitId: string): Promise<void> {
    const kit = this.kits.get(kitId);
    if (!kit) throw new Error(`Brand kit ${kitId} not found`);
    this.activeKit = kit;
    await this.storage.set("brand_guard_active_kit_id", kitId);
  }

  getActiveKit(): BrandKit | null {
    return this.activeKit;
  }

  getAllKits(): BrandKit[] {
    return Array.from(this.kits.values());
  }

  private async persist(): Promise<void> {
    await this.storage.set("brand_guard_kits", this.getAllKits());
    if (this.activeKit) {
      await this.storage.set("brand_guard_active_kit_id", this.activeKit.id);
    }
  }
}

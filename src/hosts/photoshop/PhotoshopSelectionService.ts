export class PhotoshopSelectionService {
  /**
   * Selects and reveals the target layer by hostId in Photoshop.
   */
  async selectLayer(hostId: string): Promise<void> {
    // Check if running inside Photoshop UXP environment
    if (typeof window !== "undefined" && (window as any).require) {
      try {
        const { action } = (window as any).require("photoshop");
        await action.batchPlay(
          [
            {
              _obj: "select",
              _target: [{ _ref: "layer", _id: parseInt(hostId, 10) || hostId }],
              makeVisible: false,
            },
          ],
          {}
        );
        return;
      } catch (err) {
        console.warn(`Photoshop selection via UXP batchPlay failed for layer ${hostId}:`, err);
      }
    }

    console.log(`[PhotoshopSelectionService MOCK] Selected layer: ${hostId}`);
  }
}

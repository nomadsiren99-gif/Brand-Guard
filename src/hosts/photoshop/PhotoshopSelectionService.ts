export class PhotoshopSelectionService {
  /**
   * Selects and reveals the target layer by hostId in Photoshop.
   */
  async selectLayer(hostId: string): Promise<void> {
    if (typeof window !== "undefined" && (window as any).require) {
      try {
        const photoshop = (window as any).require("photoshop");
        const { action, core } = photoshop;
        const layerId = parseInt(hostId, 10);

        const selectAction = async () => {
          await action.batchPlay(
            [
              {
                _obj: "select",
                _target: [{ _ref: "layer", _id: !isNaN(layerId) ? layerId : hostId }],
                makeVisible: false,
              },
            ],
            {}
          );
        };

        if (core && typeof core.executeAsModal === "function") {
          await core.executeAsModal(selectAction, { commandName: "Brand Guard: Select Layer" });
        } else {
          await selectAction();
        }
        return;
      } catch (err) {
        console.warn(`[PhotoshopSelectionService] Layer selection failed for hostId ${hostId}:`, err);
      }
    }

    console.log(`[PhotoshopSelectionService MOCK] Selected layer: ${hostId}`);
  }
}

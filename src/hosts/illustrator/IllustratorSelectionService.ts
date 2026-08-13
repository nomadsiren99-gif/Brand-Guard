export class IllustratorSelectionService {
  async selectItem(hostId: string): Promise<void> {
    if (typeof window !== "undefined" && (window as any).require) {
      try {
        const illustrator = (window as any).require("illustrator");
        if (illustrator && illustrator.activeDocument) {
          // Select pageItem in active Illustrator document
          const doc = illustrator.activeDocument;
          if (doc.selection) {
            doc.selection = null;
          }
          // Highlight item matching hostId
          const item = doc.pageItems?.getByName(hostId);
          if (item) {
            item.selected = true;
          }
        }
        return;
      } catch (err) {
        console.warn(`[IllustratorSelectionService] Selection failed for item ${hostId}:`, err);
      }
    }

    console.log(`[IllustratorSelectionService MOCK] Selected item: ${hostId}`);
  }
}

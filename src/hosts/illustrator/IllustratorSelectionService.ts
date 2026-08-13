import { IllustratorPageItem } from "./illustratorTypes.js";

/**
 * Returns the illustrator UXP module when running inside Illustrator, else null.
 */
export function getIllustratorModule(): any | null {
  if (typeof window !== "undefined" && (window as any).require) {
    try {
      return (window as any).require("illustrator");
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Depth-first search for a page item whose uuid or name matches hostId.
 * Illustrator has no direct id lookup, so the tree is walked.
 */
export function findPageItemById(
  items: IllustratorPageItem[] | undefined,
  hostId: string
): IllustratorPageItem | null {
  for (const item of items || []) {
    if (String(item.uuid) === hostId || item.name === hostId) return item;
    const found = findPageItemById(item.pageItems, hostId);
    if (found) return found;
  }
  return null;
}

export class IllustratorSelectionService {
  /**
   * Selects the target page item by hostId in Illustrator.
   */
  async selectItem(hostId: string): Promise<void> {
    const illustrator = getIllustratorModule();
    if (illustrator) {
      try {
        const doc = illustrator.app?.activeDocument;
        if (doc) {
          const item = findPageItemById(doc.pageItems, hostId);
          if (item) {
            doc.selection = [item];
            return;
          }
          console.warn(`[IllustratorSelectionService] No page item found for ${hostId}`);
          return;
        }
      } catch (err) {
        console.warn(`Illustrator selection failed for item ${hostId}:`, err);
      }
    }

    console.log(`[IllustratorSelectionService MOCK] Selected item: ${hostId}`);
  }
}

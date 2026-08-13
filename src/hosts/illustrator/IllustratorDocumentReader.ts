import {
  NormalizedDocument,
  NormalizedNode,
  NormalizedPaint,
  NormalizedColor,
  Bounds,
} from "../../core/models/document.js";
import { normalizeColor, cmykToRgb, grayToRgb } from "../../core/color/colorNormalization.js";
import {
  IllustratorColor,
  IllustratorDocument,
  IllustratorLayer,
  IllustratorPageItem,
} from "./illustratorTypes.js";

/**
 * Converts an Illustrator color of any model into a NormalizedColor.
 * Returns undefined for NoColor, gradients and patterns, which have no single
 * hex value to lint against.
 */
export function normalizeIllustratorColor(
  color: IllustratorColor | undefined
): NormalizedColor | undefined {
  if (!color) return undefined;

  const typename = color.typename;

  // Spot colors wrap the underlying ink.
  if (typename === "SpotColor" && color.spot?.color) {
    return normalizeIllustratorColor(color.spot.color);
  }

  if (typename === "NoColor" || typename === "GradientColor" || typename === "PatternColor") {
    return undefined;
  }

  if (color.red !== undefined || color.green !== undefined || color.blue !== undefined) {
    return normalizeColor({
      r: color.red ?? 0,
      g: color.green ?? 0,
      b: color.blue ?? 0,
    });
  }

  if (
    color.cyan !== undefined ||
    color.magenta !== undefined ||
    color.yellow !== undefined ||
    color.black !== undefined
  ) {
    return normalizeColor(
      cmykToRgb(color.cyan ?? 0, color.magenta ?? 0, color.yellow ?? 0, color.black ?? 0)
    );
  }

  if (color.gray !== undefined) {
    return normalizeColor(grayToRgb(color.gray));
  }

  return undefined;
}

/**
 * Illustrator reports geometricBounds as [left, top, right, bottom] on a Y-up
 * axis, so `top` is numerically greater than `bottom`. Normalize to a Y-down
 * box so downstream rules can treat Photoshop and Illustrator geometry alike.
 */
export function normalizeIllustratorBounds(bounds: number[] | undefined): Bounds | undefined {
  if (!bounds || bounds.length < 4) return undefined;
  const [left, top, right, bottom] = bounds;
  return {
    x: left,
    y: -top,
    width: Math.abs(right - left),
    height: Math.abs(top - bottom),
  };
}

export class IllustratorDocumentReader {
  /**
   * Converts an Illustrator app.activeDocument (or a mock descriptor) into a
   * NormalizedDocument.
   */
  read(aiDoc: IllustratorDocument | any): NormalizedDocument {
    if (!aiDoc) {
      throw new Error("No active Illustrator document available.");
    }

    const nodes: NormalizedNode[] = [];

    if (Array.isArray(aiDoc.layers) && aiDoc.layers.length > 0) {
      aiDoc.layers.forEach((layer: IllustratorLayer, index: number) => {
        nodes.push(this.mapLayerToNode(layer, index));
      });
    } else if (Array.isArray(aiDoc.pageItems)) {
      // Documents accessed via pageItems only (no layer traversal available).
      aiDoc.pageItems.forEach((item: IllustratorPageItem, index: number) => {
        nodes.push(this.mapPageItemToNode(item, `item-${index}`));
      });
    }

    return {
      id: String(aiDoc.name || "ai-active-doc"),
      name: aiDoc.name || "Untitled.ai",
      width: aiDoc.width ?? 1920,
      height: aiDoc.height ?? 1080,
      colorMode: aiDoc.documentColorSpace === "DocumentColorSpace.CMYK" ? "CMYK" : "RGB",
      resolution: 72,
      nodes,
    };
  }

  private mapLayerToNode(layer: IllustratorLayer, index: number): NormalizedNode {
    const id = `layer-${layer.name || index}`;
    const children: NormalizedNode[] = [];

    (layer.pageItems || []).forEach((item, i) => {
      children.push(this.mapPageItemToNode(item, `${id}-item-${i}`));
    });

    (layer.layers || []).forEach((sub, i) => {
      children.push(this.mapLayerToNode(sub, i));
    });

    return {
      id,
      hostId: id,
      name: layer.name || `Layer ${index + 1}`,
      type: "group",
      visible: layer.visible !== false,
      children: children.length > 0 ? children : undefined,
    };
  }

  private mapPageItemToNode(item: IllustratorPageItem, fallbackId: string): NormalizedNode {
    const typename = item.typename || "";
    const isText = typename === "TextFrame";
    const isGroup = typename === "GroupItem";

    const nodeType: NormalizedNode["type"] = isText
      ? "text"
      : isGroup
      ? "group"
      : typename === "PlacedItem" || typename === "RasterItem"
      ? "image"
      : typename === "SymbolItem"
      ? "smartObject"
      : typename === "PathItem" || typename === "CompoundPathItem"
      ? "vector"
      : "unknown";

    const charAttrs = item.textRange?.characterAttributes;

    let fill: NormalizedPaint | undefined;
    const fillColor = normalizeIllustratorColor(
      isText ? charAttrs?.fillColor ?? item.fillColor : item.fillColor
    );
    if (fillColor) {
      fill = { type: "solid", color: fillColor };
    } else if (item.filled === false) {
      fill = { type: "none" };
    }

    const strokeColor = normalizeIllustratorColor(item.strokeColor);
    const stroke =
      item.stroked && item.strokeWidth !== undefined
        ? { width: item.strokeWidth, color: strokeColor }
        : undefined;

    const typography = isText
      ? {
          fontFamily: charAttrs?.textFont?.family || charAttrs?.textFont?.name || "Helvetica",
          fontWeight: charAttrs?.textFont?.style || "Regular",
          fontSize: charAttrs?.size,
          lineHeight: charAttrs?.leading,
          letterSpacing: charAttrs?.tracking,
          color: fillColor,
        }
      : undefined;

    const children: NormalizedNode[] = [];
    if (isGroup && Array.isArray(item.pageItems)) {
      item.pageItems.forEach((sub, i) => {
        children.push(this.mapPageItemToNode(sub, `${fallbackId}-${i}`));
      });
    }

    // Illustrator opacity is 0..100.
    const rawOpacity = item.opacity ?? 100;

    const id = String(item.uuid || item.name || fallbackId);

    return {
      id,
      hostId: id,
      name: item.name || (isText ? item.contents?.slice(0, 40) : undefined) || typename || "Item",
      type: nodeType,
      visible: item.hidden !== true,
      bounds: normalizeIllustratorBounds(item.geometricBounds || item.visibleBounds),
      fill,
      stroke,
      opacity: rawOpacity > 1 ? rawOpacity / 100 : rawOpacity,
      typography,
      children: children.length > 0 ? children : undefined,
    };
  }
}

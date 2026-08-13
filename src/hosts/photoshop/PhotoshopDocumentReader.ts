import { NormalizedDocument, NormalizedNode } from "../../core/models/document.js";
import { normalizeColor } from "../../core/color/colorNormalization.js";

export class PhotoshopDocumentReader {
  /**
   * Converts Photoshop app.activeDocument or mock document descriptor into NormalizedDocument.
   */
  read(psDoc: any): NormalizedDocument {
    if (!psDoc) {
      throw new Error("No active Photoshop document available.");
    }

    const nodes: NormalizedNode[] = [];

    if (psDoc.layers && Array.isArray(psDoc.layers)) {
      psDoc.layers.forEach((layer: any) => {
        nodes.push(this.mapLayerToNode(layer));
      });
    }

    return {
      id: String(psDoc.id || "ps-active-doc"),
      name: psDoc.title || psDoc.name || "Untitled.psd",
      width: psDoc.width?._value || psDoc.width || 1920,
      height: psDoc.height?._value || psDoc.height || 1080,
      colorMode: psDoc.mode || "RGB",
      resolution: psDoc.resolution || 72,
      nodes,
    };
  }

  private mapLayerToNode(layer: any): NormalizedNode {
    const isText = layer.kind === "text" || layer.kind === 2 || layer.textKey !== undefined;
    const isShape = layer.kind === "vector" || layer.kind === 4 || layer.fill !== undefined;

    let fillPaint: any = undefined;
    if (layer.fill) {
      fillPaint = {
        type: "solid",
        color: normalizeColor({ r: layer.fill.red ?? 0, g: layer.fill.green ?? 0, b: layer.fill.blue ?? 0 }),
      };
    } else if (layer.textKey?.color) {
      const c = layer.textKey.color;
      fillPaint = {
        type: "solid",
        color: normalizeColor({ r: c.red ?? c.r ?? 0, g: c.green ?? c.g ?? 0, b: c.blue ?? c.b ?? 0 }),
      };
    }

    let typography: any = undefined;
    if (isText && layer.textKey) {
      const tk = layer.textKey;
      typography = {
        fontFamily: tk.fontName || tk.fontPostScriptName || "Helvetica Neue",
        fontWeight: tk.fontStyle || "Regular",
        fontSize: tk.size?._value || tk.size || 16,
        color: fillPaint?.color,
      };
    }

    const nodeType = isText ? "text" : isShape ? "shape" : layer.kind === "group" ? "group" : "unknown";

    // Photoshop layer opacity is 0..255 or 0..100
    const rawOpacity = layer.opacity !== undefined ? layer.opacity : 100;
    const normalizedOpacity = rawOpacity > 1 ? rawOpacity / 100 : rawOpacity;

    const children: NormalizedNode[] = [];
    if (layer.layers && Array.isArray(layer.layers)) {
      layer.layers.forEach((sub: any) => children.push(this.mapLayerToNode(sub)));
    }

    return {
      id: String(layer.id || layer.name),
      hostId: String(layer.id || layer.name),
      name: layer.name || "Layer",
      type: nodeType,
      visible: layer.visible !== false,
      bounds: layer.bounds
        ? {
            x: layer.bounds.left || 0,
            y: layer.bounds.top || 0,
            width: (layer.bounds.right || 0) - (layer.bounds.left || 0),
            height: (layer.bounds.bottom || 0) - (layer.bounds.top || 0),
          }
        : undefined,
      fill: fillPaint,
      opacity: normalizedOpacity,
      typography,
      radius: layer.radius,
      children: children.length > 0 ? children : undefined,
    };
  }
}

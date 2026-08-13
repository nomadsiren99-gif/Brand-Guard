import { NormalizedDocument, NormalizedNode } from "../../core/models/document.js";
import { normalizeColor } from "../../core/color/colorNormalization.js";
import { IllustratorDocumentDescriptor, IllustratorItem } from "./illustratorTypes.js";

export class IllustratorDocumentReader {
  read(aiDoc: IllustratorDocumentDescriptor | any): NormalizedDocument {
    if (!aiDoc) {
      throw new Error("No active Illustrator document available.");
    }

    const nodes: NormalizedNode[] = [];
    const items = aiDoc.items || aiDoc.pageItems || [];

    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        nodes.push(this.mapItemToNode(item));
      });
    }

    return {
      id: String(aiDoc.id || "ai-active-doc"),
      name: aiDoc.name || aiDoc.title || "Untitled.ai",
      width: aiDoc.width || 800,
      height: aiDoc.height || 600,
      colorMode: aiDoc.documentColorSpace || "RGB",
      resolution: 300,
      nodes,
    };
  }

  private mapItemToNode(item: IllustratorItem | any): NormalizedNode {
    const isText = item.typename === "TextFrame" || item.textRange !== undefined;
    const isShape = item.typename === "PathItem" || item.typename === "CompoundPathItem" || item.fillColor !== undefined;
    const isGroup = item.typename === "GroupItem" || (item.children && item.children.length > 0);

    let fillPaint: any = undefined;
    if (item.fillColor) {
      fillPaint = {
        type: "solid",
        color: normalizeColor({
          r: item.fillColor.red ?? 0,
          g: item.fillColor.green ?? 0,
          b: item.fillColor.blue ?? 0,
        }),
      };
    }

    let strokePaint: any = undefined;
    if (item.strokeColor || item.strokeWidth) {
      strokePaint = {
        width: item.strokeWidth || 1,
        color: item.strokeColor
          ? normalizeColor({
              r: item.strokeColor.red ?? 0,
              g: item.strokeColor.green ?? 0,
              b: item.strokeColor.blue ?? 0,
            })
          : undefined,
      };
    }

    let typography: any = undefined;
    if (isText && item.textRange) {
      typography = {
        fontFamily: item.textRange.font || "Helvetica Neue",
        fontWeight: "Regular",
        fontSize: item.textRange.size || 12,
        color: fillPaint?.color,
      };
    }

    const nodeType = isText ? "text" : isShape ? "shape" : isGroup ? "group" : "vector";

    const rawOpacity = item.opacity !== undefined ? item.opacity : 100;
    const normalizedOpacity = rawOpacity > 1 ? rawOpacity / 100 : rawOpacity;

    const children: NormalizedNode[] = [];
    if (item.children && Array.isArray(item.children)) {
      item.children.forEach((sub: any) => children.push(this.mapItemToNode(sub)));
    }

    return {
      id: String(item.id || item.name || Math.random().toString(36).substring(2, 7)),
      hostId: String(item.id || item.name || Math.random().toString(36).substring(2, 7)),
      name: item.name || (isText ? "Text Frame" : "Path"),
      type: nodeType,
      visible: item.hidden !== true,
      bounds: {
        x: item.position ? item.position[0] : 0,
        y: item.position ? item.position[1] : 0,
        width: item.width || 100,
        height: item.height || 100,
      },
      fill: fillPaint,
      stroke: strokePaint,
      opacity: normalizedOpacity,
      typography,
      children: children.length > 0 ? children : undefined,
    };
  }
}

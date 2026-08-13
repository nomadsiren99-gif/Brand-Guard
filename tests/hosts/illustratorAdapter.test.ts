import { describe, it, expect } from "vitest";
import { IllustratorDocumentReader } from "../../src/hosts/illustrator/IllustratorDocumentReader.js";
import { IllustratorAdapter } from "../../src/hosts/illustrator/IllustratorAdapter.js";
import { IllustratorDocumentDescriptor } from "../../src/hosts/illustrator/illustratorTypes.js";

describe("Illustrator Adapter & Document Reader", () => {
  it("should normalize Illustrator document items into standard NormalizedDocument structure", () => {
    const reader = new IllustratorDocumentReader();
    const mockAiDoc: IllustratorDocumentDescriptor = {
      name: "Campaign Banner.ai",
      width: 1200,
      height: 630,
      items: [
        {
          id: "item-1",
          name: "Headline",
          typename: "TextFrame",
          textRange: {
            contents: "Acme Product Launch",
            font: "Arial",
            size: 48,
          },
          fillColor: { red: 8, green: 101, blue: 250 },
        },
        {
          id: "item-2",
          name: "Background Box",
          typename: "PathItem",
          fillColor: { red: 0, green: 102, blue: 255 },
          strokeWidth: 2,
          strokeColor: { red: 0, green: 27, blue: 68 },
        },
      ],
    };

    const normalized = reader.read(mockAiDoc);

    expect(normalized.name).toBe("Campaign Banner.ai");
    expect(normalized.width).toBe(1200);
    expect(normalized.nodes.length).toBe(2);

    const textNode = normalized.nodes.find((n) => n.id === "item-1");
    expect(textNode).toBeDefined();
    expect(textNode?.type).toBe("text");
    expect(textNode?.typography?.fontFamily).toBe("Arial");
    expect(textNode?.typography?.fontSize).toBe(48);

    const shapeNode = normalized.nodes.find((n) => n.id === "item-2");
    expect(shapeNode).toBeDefined();
    expect(shapeNode?.type).toBe("shape");
    expect(shapeNode?.fill?.color?.hex).toBe("#0066FF");
    expect(shapeNode?.stroke?.width).toBe(2);
  });

  it("should initialize IllustratorAdapter with correct host capabilities", async () => {
    const adapter = new IllustratorAdapter();
    expect(adapter.host).toBe("illustrator");
    expect(adapter.capabilities.readColor).toBe(true);
    expect(adapter.capabilities.readTypography).toBe(true);
  });
});

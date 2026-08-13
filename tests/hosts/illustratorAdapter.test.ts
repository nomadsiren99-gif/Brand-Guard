import { describe, it, expect } from "vitest";
import {
  IllustratorDocumentReader,
  normalizeIllustratorColor,
  normalizeIllustratorBounds,
} from "../../src/hosts/illustrator/IllustratorDocumentReader.js";
import { IllustratorAdapter } from "../../src/hosts/illustrator/IllustratorAdapter.js";
import { findPageItemById } from "../../src/hosts/illustrator/IllustratorSelectionService.js";
import { createHostAdapter, detectHost } from "../../src/hosts/createHostAdapter.js";
import { cmykToRgb, grayToRgb } from "../../src/core/color/colorNormalization.js";
import { IllustratorDocument } from "../../src/hosts/illustrator/illustratorTypes.js";

const mockDoc: IllustratorDocument = {
  name: "Poster.ai",
  width: 1200,
  height: 1600,
  documentColorSpace: "DocumentColorSpace.RGB",
  layers: [
    {
      name: "Artwork",
      visible: true,
      pageItems: [
        {
          typename: "TextFrame",
          uuid: "text-1",
          name: "Headline",
          hidden: false,
          opacity: 100,
          geometricBounds: [100, -40, 500, -96],
          contents: "Big News",
          textRange: {
            characterAttributes: {
              textFont: { name: "Futura-Bold", family: "Futura", style: "Bold" },
              size: 42,
              fillColor: { typename: "RGBColor", red: 0, green: 102, blue: 255 },
            },
          },
        },
        {
          typename: "PathItem",
          uuid: "path-1",
          name: "Divider",
          hidden: false,
          opacity: 50,
          geometricBounds: [100, -120, 500, -124],
          filled: false,
          stroked: true,
          strokeWidth: 3,
          strokeColor: { typename: "CMYKColor", cyan: 0, magenta: 0, yellow: 0, black: 100 },
        },
        {
          typename: "GroupItem",
          uuid: "group-1",
          name: "Logo Lockup",
          hidden: false,
          opacity: 100,
          geometricBounds: [100, -200, 260, -240],
          pageItems: [
            {
              typename: "PathItem",
              uuid: "mark-1",
              name: "mark",
              hidden: false,
              opacity: 100,
              geometricBounds: [100, -200, 140, -240],
              filled: true,
              fillColor: { typename: "GrayColor", gray: 100 },
            },
          ],
        },
      ],
    },
  ],
};

describe("Illustrator color normalization", () => {
  it("converts RGB colors", () => {
    expect(normalizeIllustratorColor({ typename: "RGBColor", red: 0, green: 102, blue: 255 })?.hex).toBe(
      "#0066FF"
    );
  });

  it("converts CMYK colors", () => {
    expect(cmykToRgb(0, 0, 0, 100)).toEqual({ r: 0, g: 0, b: 0 });
    expect(cmykToRgb(0, 0, 0, 0)).toEqual({ r: 255, g: 255, b: 255 });
    expect(
      normalizeIllustratorColor({ typename: "CMYKColor", cyan: 100, magenta: 0, yellow: 0, black: 0 })?.hex
    ).toBe("#00FFFF");
  });

  it("converts gray, where 100 is black", () => {
    expect(grayToRgb(100)).toEqual({ r: 0, g: 0, b: 0 });
    expect(grayToRgb(0)).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("unwraps spot colors to the underlying ink", () => {
    const spot = {
      typename: "SpotColor",
      spot: { color: { typename: "RGBColor", red: 255, green: 0, blue: 0 } },
    };
    expect(normalizeIllustratorColor(spot)?.hex).toBe("#FF0000");
  });

  it("returns undefined for colors with no single hex value", () => {
    expect(normalizeIllustratorColor({ typename: "NoColor" })).toBeUndefined();
    expect(normalizeIllustratorColor({ typename: "GradientColor" })).toBeUndefined();
    expect(normalizeIllustratorColor(undefined)).toBeUndefined();
  });
});

describe("Illustrator bounds normalization", () => {
  it("converts Y-up geometricBounds into a Y-down box", () => {
    // [left, top, right, bottom] with top above bottom on a Y-up axis
    expect(normalizeIllustratorBounds([100, -40, 500, -96])).toEqual({
      x: 100,
      y: 40,
      width: 400,
      height: 56,
    });
  });

  it("returns undefined for malformed bounds", () => {
    expect(normalizeIllustratorBounds(undefined)).toBeUndefined();
    expect(normalizeIllustratorBounds([1, 2])).toBeUndefined();
  });
});

describe("IllustratorDocumentReader", () => {
  const doc = new IllustratorDocumentReader().read(mockDoc);

  it("reads document metadata", () => {
    expect(doc.name).toBe("Poster.ai");
    expect(doc.width).toBe(1200);
    expect(doc.colorMode).toBe("RGB");
  });

  it("maps layers to group nodes containing their page items", () => {
    expect(doc.nodes).toHaveLength(1);
    expect(doc.nodes[0].type).toBe("group");
    expect(doc.nodes[0].children).toHaveLength(3);
  });

  it("maps a TextFrame into a normalized text node", () => {
    const text = doc.nodes[0].children!.find((n) => n.id === "text-1")!;
    expect(text.type).toBe("text");
    expect(text.typography?.fontFamily).toBe("Futura");
    expect(text.typography?.fontWeight).toBe("Bold");
    expect(text.typography?.fontSize).toBe(42);
    expect(text.fill?.color?.hex).toBe("#0066FF");
    expect(text.bounds).toEqual({ x: 100, y: 40, width: 400, height: 56 });
  });

  it("maps a stroked PathItem and rescales 0..100 opacity to 0..1", () => {
    const path = doc.nodes[0].children!.find((n) => n.id === "path-1")!;
    expect(path.type).toBe("vector");
    expect(path.stroke?.width).toBe(3);
    expect(path.stroke?.color?.hex).toBe("#000000");
    expect(path.fill?.type).toBe("none");
    expect(path.opacity).toBe(0.5);
  });

  it("recurses into groups", () => {
    const group = doc.nodes[0].children!.find((n) => n.id === "group-1")!;
    expect(group.type).toBe("group");
    expect(group.children).toHaveLength(1);
    expect(group.children![0].name).toBe("mark");
    expect(group.children![0].fill?.color?.hex).toBe("#000000");
  });

  it("falls back to pageItems when no layers are present", () => {
    const flat = new IllustratorDocumentReader().read({
      name: "Flat.ai",
      pageItems: [{ typename: "PathItem", uuid: "p", name: "Only", opacity: 100 }],
    });
    expect(flat.nodes).toHaveLength(1);
    expect(flat.nodes[0].name).toBe("Only");
  });

  it("throws when there is no document", () => {
    expect(() => new IllustratorDocumentReader().read(null)).toThrow(/No active Illustrator document/);
  });
});

describe("findPageItemById", () => {
  const items = mockDoc.layers![0].pageItems!;

  it("finds a top level item by uuid", () => {
    expect(findPageItemById(items, "path-1")?.name).toBe("Divider");
  });

  it("finds a nested item inside a group", () => {
    expect(findPageItemById(items, "mark-1")?.name).toBe("mark");
  });

  it("falls back to matching by name", () => {
    expect(findPageItemById(items, "Headline")?.uuid).toBe("text-1");
  });

  it("returns null when nothing matches", () => {
    expect(findPageItemById(items, "nope")).toBeNull();
  });
});

describe("IllustratorAdapter", () => {
  it("declares Illustrator capabilities, with radius unsupported", () => {
    const adapter = new IllustratorAdapter();
    expect(adapter.host).toBe("illustrator");
    expect(adapter.capabilities.readColor).toBe(true);
    expect(adapter.capabilities.readRadius).toBe(false);
    expect(adapter.capabilities.writeRadius).toBe(false);
  });

  it("returns null for the active document outside a UXP host", async () => {
    expect(await new IllustratorAdapter().getActiveDocument()).toBeNull();
  });
});

describe("createHostAdapter", () => {
  it("defaults to Photoshop outside a UXP host", () => {
    expect(detectHost()).toBe("photoshop");
    expect(createHostAdapter().host).toBe("photoshop");
  });

  it("builds the requested adapter when the host is given explicitly", () => {
    expect(createHostAdapter("illustrator").host).toBe("illustrator");
    expect(createHostAdapter("photoshop").host).toBe("photoshop");
  });
});

import { describe, it, expect } from "vitest";
import { SpacingGridRule } from "../../src/core/rules/SpacingRules.js";
import { BrandKit } from "../../src/core/models/brandKit.js";
import { NormalizedDocument } from "../../src/core/models/document.js";

const baseKit: BrandKit = {
  id: "test-kit",
  name: "Test Kit",
  version: "1.0.0",
  colors: [],
  typography: [],
  spacing: { baseUnit: 8, tolerance: 0.5 },
};

function docWith(nodes: NormalizedDocument["nodes"]): NormalizedDocument {
  return { id: "d", name: "d", width: 100, height: 100, nodes };
}

describe("BG-SPACE-001 spacing grid rule", () => {
  it("reports layers whose position is off the grid and snaps to the nearest multiple", async () => {
    const doc = docWith([
      {
        id: "n1",
        hostId: "h1",
        name: "Off grid",
        type: "shape",
        visible: true,
        bounds: { x: 100, y: 37, width: 50, height: 50 },
      },
    ]);

    const issues = await new SpacingGridRule().evaluate(doc, { kit: baseKit });

    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("BG-SPACE-001");
    expect(issues[0].category).toBe("spacing");
    // 100 -> 104 (nearest multiple of 8), 37 -> 40
    expect(issues[0].fix?.type).toBe("setPosition");
    expect(issues[0].fix?.payload).toEqual({ x: 104, y: 40 });
    expect(issues[0].fix?.safety).toBe("review");
  });

  it("passes layers already aligned to the grid", async () => {
    const doc = docWith([
      {
        id: "n1",
        hostId: "h1",
        name: "On grid",
        type: "shape",
        visible: true,
        bounds: { x: 96, y: 40, width: 50, height: 50 },
      },
    ]);

    expect(await new SpacingGridRule().evaluate(doc, { kit: baseKit })).toHaveLength(0);
  });

  it("honours the tolerance before flagging a position", async () => {
    const doc = docWith([
      {
        id: "n1",
        hostId: "h1",
        name: "Nearly aligned",
        type: "shape",
        visible: true,
        bounds: { x: 96.4, y: 40, width: 50, height: 50 },
      },
    ]);

    expect(await new SpacingGridRule().evaluate(doc, { kit: baseKit })).toHaveLength(0);
  });

  it("checks width and height only when checkDimensions is enabled", async () => {
    const doc = docWith([
      {
        id: "n1",
        hostId: "h1",
        name: "Odd size",
        type: "shape",
        visible: true,
        bounds: { x: 96, y: 40, width: 51, height: 50 },
      },
    ]);

    expect(await new SpacingGridRule().evaluate(doc, { kit: baseKit })).toHaveLength(0);

    const strictKit: BrandKit = {
      ...baseKit,
      spacing: { baseUnit: 8, tolerance: 0.5, checkDimensions: true },
    };
    const issues = await new SpacingGridRule().evaluate(doc, { kit: strictKit });
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.type).toBe("resize");
    expect(issues[0].fix?.payload).toEqual({ width: 48, height: 48 });
  });

  it("uses an explicit spacing scale when one is configured", async () => {
    const scaleKit: BrandKit = {
      ...baseKit,
      spacing: { baseUnit: 8, allowedValues: [0, 12, 24, 48] },
    };
    const doc = docWith([
      {
        id: "n1",
        hostId: "h1",
        name: "Off scale",
        type: "shape",
        visible: true,
        bounds: { x: 20, y: 24, width: 10, height: 10 },
      },
    ]);

    const issues = await new SpacingGridRule().evaluate(doc, { kit: scaleKit });
    expect(issues).toHaveLength(1);
    // 20 snaps to 24 on the explicit scale; y=24 is already valid.
    expect(issues[0].fix?.payload).toEqual({ x: 24 });
  });

  it("is inert when the kit defines no spacing config", async () => {
    const doc = docWith([
      {
        id: "n1",
        hostId: "h1",
        name: "Off grid",
        type: "shape",
        visible: true,
        bounds: { x: 37, y: 37, width: 10, height: 10 },
      },
    ]);

    const kitWithoutSpacing: BrandKit = { ...baseKit, spacing: undefined };
    expect(await new SpacingGridRule().evaluate(doc, { kit: kitWithoutSpacing })).toHaveLength(0);
  });

  it("skips hidden layers", async () => {
    const doc = docWith([
      {
        id: "n1",
        hostId: "h1",
        name: "Hidden",
        type: "shape",
        visible: false,
        bounds: { x: 37, y: 37, width: 10, height: 10 },
      },
    ]);

    expect(await new SpacingGridRule().evaluate(doc, { kit: baseKit })).toHaveLength(0);
  });
});

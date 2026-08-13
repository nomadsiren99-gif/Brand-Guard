import { describe, it, expect } from "vitest";
import {
  LogoMinimumSizeRule,
  LogoClearSpaceRule,
  LogoAspectRatioRule,
  LogoColorRule,
} from "../../src/core/rules/LogoRules.js";
import { BrandKit, LogoAsset } from "../../src/core/models/brandKit.js";
import { NormalizedDocument, NormalizedNode } from "../../src/core/models/document.js";

function kitWithLogo(overrides: Partial<LogoAsset> = {}): BrandKit {
  return {
    id: "test-kit",
    name: "Test Kit",
    version: "1.0.0",
    colors: [],
    typography: [],
    logo: {
      enabled: true,
      assets: [
        {
          id: "primary",
          name: "Primary Logo",
          namePatterns: ["logo"],
          minWidth: 96,
          minHeight: 24,
          clearSpace: 24,
          aspectRatio: 4,
          allowedColors: ["#0066FF", "#FFFFFF"],
          ...overrides,
        },
      ],
    },
  };
}

function docWith(nodes: NormalizedNode[]): NormalizedDocument {
  return { id: "d", name: "d", width: 1000, height: 1000, nodes };
}

const compliantLogo: NormalizedNode = {
  id: "logo",
  hostId: "h-logo",
  name: "Header / Logo",
  type: "image",
  visible: true,
  bounds: { x: 100, y: 100, width: 160, height: 40 },
  fill: { type: "solid", color: { hex: "#0066FF" } },
};

describe("BG-LOGO-001 minimum size", () => {
  it("flags a logo reproduced below its minimum size", async () => {
    const doc = docWith([{ ...compliantLogo, bounds: { x: 0, y: 0, width: 60, height: 15 } }]);
    const issues = await new LogoMinimumSizeRule().evaluate(doc, { kit: kitWithLogo() });

    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("BG-LOGO-001");
    expect(issues[0].severity).toBe("error");
    expect(issues[0].fix?.type).toBe("resize");
    expect(issues[0].fix?.payload).toEqual({ width: 96, height: 24 });
  });

  it("passes a logo at or above the minimum size", async () => {
    const issues = await new LogoMinimumSizeRule().evaluate(docWith([compliantLogo]), {
      kit: kitWithLogo(),
    });
    expect(issues).toHaveLength(0);
  });
});

describe("BG-LOGO-002 clear space", () => {
  it("flags a layer intruding into the clear space", async () => {
    const intruder: NormalizedNode = {
      id: "badge",
      hostId: "h-badge",
      name: "Promo Badge",
      type: "shape",
      visible: true,
      // 10px to the right of the logo, well inside the 24px exclusion zone
      bounds: { x: 270, y: 100, width: 40, height: 40 },
    };

    const issues = await new LogoClearSpaceRule().evaluate(docWith([compliantLogo, intruder]), {
      kit: kitWithLogo(),
    });

    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("BG-LOGO-002");
    expect(issues[0].description).toContain("Promo Badge");
    // Moving other artwork is never automatic.
    expect(issues[0].fix).toBeUndefined();
  });

  it("allows a layer outside the clear space", async () => {
    const distant: NormalizedNode = {
      id: "badge",
      hostId: "h-badge",
      name: "Promo Badge",
      type: "shape",
      visible: true,
      bounds: { x: 400, y: 100, width: 40, height: 40 },
    };

    const issues = await new LogoClearSpaceRule().evaluate(docWith([compliantLogo, distant]), {
      kit: kitWithLogo(),
    });
    expect(issues).toHaveLength(0);
  });

  it("does not treat an enclosing background as an intrusion", async () => {
    const backdrop: NormalizedNode = {
      id: "bg",
      hostId: "h-bg",
      name: "Page Background",
      type: "shape",
      visible: true,
      bounds: { x: 0, y: 0, width: 1000, height: 1000 },
    };

    const issues = await new LogoClearSpaceRule().evaluate(docWith([backdrop, compliantLogo]), {
      kit: kitWithLogo(),
    });
    expect(issues).toHaveLength(0);
  });

  it("does not treat the logo's own children as intrusions", async () => {
    const groupedLogo: NormalizedNode = {
      ...compliantLogo,
      type: "group",
      children: [
        {
          id: "logo-mark",
          hostId: "h-mark",
          name: "mark",
          type: "vector",
          visible: true,
          bounds: { x: 105, y: 105, width: 30, height: 30 },
        },
      ],
    };

    const issues = await new LogoClearSpaceRule().evaluate(docWith([groupedLogo]), {
      kit: kitWithLogo(),
    });
    expect(issues).toHaveLength(0);
  });
});

describe("BG-LOGO-003 aspect ratio", () => {
  it("flags a stretched logo as critical", async () => {
    // 200x40 => ratio 5, required 4
    const stretched = { ...compliantLogo, bounds: { x: 100, y: 100, width: 200, height: 40 } };
    const issues = await new LogoAspectRatioRule().evaluate(docWith([stretched]), {
      kit: kitWithLogo(),
    });

    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("critical");
    expect(issues[0].actual).toBe(5);
    expect(issues[0].expected).toBe(4);
    expect(issues[0].fix?.payload).toEqual({ width: 160, height: 40 });
  });

  it("allows deviation within tolerance", async () => {
    // 161x40 => ratio 4.025, ~0.6% off, inside the default 2% tolerance
    const slightly = { ...compliantLogo, bounds: { x: 100, y: 100, width: 161, height: 40 } };
    const issues = await new LogoAspectRatioRule().evaluate(docWith([slightly]), {
      kit: kitWithLogo(),
    });
    expect(issues).toHaveLength(0);
  });
});

describe("BG-LOGO-004 logo color", () => {
  it("flags an unapproved logo colorway with a safe fix", async () => {
    const recolored = { ...compliantLogo, fill: { type: "solid" as const, color: { hex: "#FF6B00" } } };
    const issues = await new LogoColorRule().evaluate(docWith([recolored]), { kit: kitWithLogo() });

    expect(issues).toHaveLength(1);
    expect(issues[0].actual).toBe("#FF6B00");
    expect(issues[0].fix?.type).toBe("replaceColor");
    expect(issues[0].fix?.safety).toBe("safe");
    expect(issues[0].fix?.payload.color).toBe("#0066FF");
  });

  it("accepts an approved colorway regardless of hex casing", async () => {
    const lower = { ...compliantLogo, fill: { type: "solid" as const, color: { hex: "#ffffff" } } };
    const issues = await new LogoColorRule().evaluate(docWith([lower]), { kit: kitWithLogo() });
    expect(issues).toHaveLength(0);
  });
});

describe("logo rules gating", () => {
  it("are inert when the logo config is disabled", async () => {
    const kit = kitWithLogo();
    kit.logo!.enabled = false;
    const stretched = { ...compliantLogo, bounds: { x: 0, y: 0, width: 10, height: 1 } };
    const doc = docWith([stretched]);

    expect(await new LogoMinimumSizeRule().evaluate(doc, { kit })).toHaveLength(0);
    expect(await new LogoAspectRatioRule().evaluate(doc, { kit })).toHaveLength(0);
    expect(await new LogoColorRule().evaluate(doc, { kit })).toHaveLength(0);
    expect(await new LogoClearSpaceRule().evaluate(doc, { kit })).toHaveLength(0);
  });

  it("ignore layers whose name does not match a logo pattern", async () => {
    const notALogo = { ...compliantLogo, id: "hero", name: "Hero Image" };
    const issues = await new LogoAspectRatioRule().evaluate(
      docWith([{ ...notALogo, bounds: { x: 0, y: 0, width: 200, height: 40 } }]),
      { kit: kitWithLogo() }
    );
    expect(issues).toHaveLength(0);
  });

  it("survive an invalid regex in namePatterns", async () => {
    const kit = kitWithLogo({ namePatterns: ["([unclosed", "logo"] });
    const issues = await new LogoColorRule().evaluate(
      docWith([{ ...compliantLogo, fill: { type: "solid" as const, color: { hex: "#FF6B00" } } }]),
      { kit }
    );
    expect(issues).toHaveLength(1);
  });
});

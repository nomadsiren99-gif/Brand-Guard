import { describe, it, expect } from "vitest";
import { RuleRegistry } from "../../src/core/rules/RuleRegistry.js";
import { RuleRunner } from "../../src/core/rules/RuleRunner.js";
import { IssueStore } from "../../src/core/issues/IssueStore.js";
import { IgnoreStore } from "../../src/core/ignore/IgnoreStore.js";
import { ComplianceScoreService } from "../../src/core/score/ComplianceScoreService.js";
import { ScanController } from "../../src/core/scanner/ScanController.js";
import { demoDocument } from "../../src/core/fixtures/demoDocument.js";
import acmeBrand from "../../examples/acme-brand.brandguard.json" assert { type: "json" };
import { BrandKit } from "../../src/core/models/brandKit.js";

describe("Brand Guard Core Engine (Milestone 1 Test Flow)", () => {
  it("should load Acme Brand Kit, evaluate demo document, identify expected issues, score document, and handle ignores", async () => {
    const kit = acmeBrand as unknown as BrandKit;
    expect(kit.name).toBe("Acme Brand");

    const ruleRegistry = new RuleRegistry();
    const ruleRunner = new RuleRunner();
    const issueStore = new IssueStore();
    const ignoreStore = new IgnoreStore();
    const scoreService = new ComplianceScoreService();

    const controller = new ScanController(
      ruleRegistry,
      ruleRunner,
      issueStore,
      ignoreStore,
      scoreService
    );

    // 1. Initial Scan
    const result = await controller.scanDocument(demoDocument, kit);

    expect(result.issues.length).toBeGreaterThanOrEqual(4);

    // Verify Color Near-Match issue
    const colorIssue = result.issues.find((i) => i.nodeId === "cta-bg" && i.category === "color");
    expect(colorIssue).toBeDefined();
    expect(colorIssue?.ruleId).toBe("BG-COLOR-002");
    expect(colorIssue?.expected).toBe("#0066FF");
    expect(colorIssue?.fix).toBeDefined();
    expect(colorIssue?.fix?.type).toBe("replaceColor");

    // Verify Font issue
    const fontIssue = result.issues.find((i) => i.nodeId === "hero-heading" && i.category === "typography");
    expect(fontIssue).toBeDefined();
    expect(fontIssue?.actual).toBe("Arial");
    expect(fontIssue?.expected).toBe("Helvetica Neue");

    // Verify Radius issue
    const radiusIssue = result.issues.find((i) => i.nodeId === "cta-bg" && i.category === "radius");
    expect(radiusIssue).toBeDefined();
    expect(radiusIssue?.expected).toBe("16px");

    // Verify Opacity issue
    const opacityIssue = result.issues.find((i) => i.nodeId === "hero-desc" && i.category === "opacity");
    expect(opacityIssue).toBeDefined();
    expect(opacityIssue?.expected).toBe("80%");

    // Score verification
    expect(result.score).toBeLessThan(100);

    // 2. Ignore mechanism test (Ignore this rule on this node)
    ignoreStore.addIgnore({
      id: "ignore-1",
      kitId: kit.id,
      ruleId: colorIssue!.ruleId,
      nodeFingerprint: colorIssue!.nodeId,
      scope: "node-rule",
      createdAt: new Date().toISOString(),
    });

    const rescanResult = await controller.scanDocument(demoDocument, kit);
    expect(rescanResult.issues.find((i) => i.id === colorIssue!.id)).toBeUndefined();
    expect(rescanResult.score).toBeGreaterThan(result.score);
  });

  it("should surface spacing and logo violations through the full scan pipeline", async () => {
    const kit = acmeBrand as unknown as BrandKit;

    const controller = new ScanController(
      new RuleRegistry(),
      new RuleRunner(),
      new IssueStore(),
      new IgnoreStore(),
      new ComplianceScoreService()
    );

    const { issues } = await controller.scanDocument(demoDocument, kit);

    // Spacing: hero layers sit at x=100, off the 8px grid.
    const spacingIssue = issues.find((i) => i.nodeId === "hero-heading" && i.category === "spacing");
    expect(spacingIssue).toBeDefined();
    expect(spacingIssue?.ruleId).toBe("BG-SPACE-001");
    expect(spacingIssue?.fix?.payload).toMatchObject({ x: 104 });

    // Logo: 150x30 is a 5.0 ratio against the required 4.0.
    const ratioIssue = issues.find((i) => i.ruleId === "BG-LOGO-003");
    expect(ratioIssue).toBeDefined();
    expect(ratioIssue?.nodeId).toBe("brand-logo");
    expect(ratioIssue?.severity).toBe("critical");

    // Logo: #FF6B00 is not an approved colorway.
    const logoColorIssue = issues.find((i) => i.ruleId === "BG-LOGO-004");
    expect(logoColorIssue).toBeDefined();
    expect(logoColorIssue?.actual).toBe("#FF6B00");
    expect(logoColorIssue?.fix?.safety).toBe("safe");

    // Logo: the promo badge sits inside the 24px clear space.
    const clearSpaceIssue = issues.find((i) => i.ruleId === "BG-LOGO-002");
    expect(clearSpaceIssue).toBeDefined();
    expect(clearSpaceIssue?.description).toContain("Promo Badge");

    // The logo is above its 96x24 minimum, so no size violation.
    expect(issues.find((i) => i.ruleId === "BG-LOGO-001")).toBeUndefined();
  });
});

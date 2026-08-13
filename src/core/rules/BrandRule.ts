import { BrandRule, RuleContext } from "../models/rules.js";
import { BrandIssue, IssueSeverity } from "../models/issues.js";
import { NormalizedDocument, NormalizedNode } from "../models/document.js";
import { ColorMatcher } from "../color/ColorMatcher.js";

export function flattenNodes(nodes: NormalizedNode[]): NormalizedNode[] {
  const result: NormalizedNode[] = [];
  function recurse(list: NormalizedNode[]) {
    for (const node of list) {
      result.push(node);
      if (node.children && node.children.length > 0) {
        recurse(node.children);
      }
    }
  }
  recurse(nodes);
  return result;
}

// BG-COLOR-001 & BG-COLOR-002: Color Rules
export class ApprovedColorRule implements BrandRule {
  id = "BG-COLOR-001";
  name = "Approved brand colors";
  category = "color" as const;
  severity = "error" as const;

  async evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]> {
    const issues: BrandIssue[] = [];
    const matcher: ColorMatcher = context.colorMatcher || new ColorMatcher();
    const allNodes = flattenNodes(document.nodes);

    for (const node of allNodes) {
      if (!node.visible) continue;
      const paintColor = node.fill?.color;
      if (!paintColor) continue;

      const match = matcher.findClosest(paintColor, context.kit.colors);

      if (!match.approved) {
        const isNearMatch = match.isNearMatch && match.matchedColor;
        const expectedColor = match.matchedColor?.value.hex || context.kit.colors[0]?.value.hex || "#000000";

        issues.push({
          id: `issue-${node.id}-color-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ruleId: isNearMatch ? "BG-COLOR-002" : "BG-COLOR-001",
          category: "color",
          severity: isNearMatch ? "warning" : "error",
          title: isNearMatch ? "Near-match brand color" : "Unapproved brand color",
          description: isNearMatch
            ? `Color ${paintColor.hex} is very close to approved ${match.matchedColor?.name} (${expectedColor}).`
            : `Color ${paintColor.hex} is not in the approved brand palette.`,
          nodeId: node.id,
          hostNodeId: node.hostId,
          location: {
            nodeName: node.name,
          },
          actual: paintColor.hex,
          expected: expectedColor,
          confidence: 0.95,
          fix: match.matchedColor && match.matchedColor.autoFix
            ? {
                id: `fix-${node.id}-color`,
                type: "replaceColor",
                safety: "safe",
                nodeId: node.id,
                payload: {
                  color: expectedColor,
                  colorName: match.matchedColor.name,
                },
              }
            : undefined,
          state: "open",
          createdAt: new Date().toISOString(),
        });
      }
    }

    return issues;
  }
}

// BG-TYPE-001: Approved Font Family
export class ApprovedTypographyRule implements BrandRule {
  id = "BG-TYPE-001";
  name = "Approved font family";
  category = "typography" as const;
  severity = "error" as const;

  async evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]> {
    const issues: BrandIssue[] = [];
    const allNodes = flattenNodes(document.nodes);
    const approvedFamilies = new Set(
      context.kit.typography.flatMap((t) => t.fontFamilies.map((f) => f.toLowerCase()))
    );

    for (const node of allNodes) {
      if (!node.visible || node.type !== "text" || !node.typography) continue;

      const family = node.typography.fontFamily;
      if (!family) continue;

      if (!approvedFamilies.has(family.toLowerCase())) {
        const defaultApproved = context.kit.typography[0]?.fontFamilies[0] || "Helvetica Neue";
        issues.push({
          id: `issue-${node.id}-font-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ruleId: "BG-TYPE-001",
          category: "typography",
          severity: "error",
          title: "Unapproved font family",
          description: `Font family '${family}' is not in approved brand fonts.`,
          nodeId: node.id,
          hostNodeId: node.hostId,
          location: { nodeName: node.name },
          actual: family,
          expected: defaultApproved,
          confidence: 0.9,
          fix: {
            id: `fix-${node.id}-font`,
            type: "replaceFont",
            safety: "safe",
            nodeId: node.id,
            payload: { fontFamily: defaultApproved },
          },
          state: "open",
          createdAt: new Date().toISOString(),
        });
      }
    }

    return issues;
  }
}

// BG-TYPE-002: Approved Font Weight
export class ApprovedFontWeightRule implements BrandRule {
  id = "BG-TYPE-002";
  name = "Approved font weight";
  category = "typography" as const;
  severity = "warning" as const;

  async evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]> {
    const issues: BrandIssue[] = [];
    const allNodes = flattenNodes(document.nodes);
    const approvedWeights = new Set(
      context.kit.typography.flatMap((t) => (t.fontWeights || []).map((w) => String(w).toLowerCase()))
    );

    if (approvedWeights.size === 0) return issues;

    for (const node of allNodes) {
      if (!node.visible || node.type !== "text" || !node.typography) continue;

      const weight = node.typography.fontWeight ? String(node.typography.fontWeight) : undefined;
      if (!weight) continue;

      if (!approvedWeights.has(weight.toLowerCase())) {
        const expectedWeight = Array.from(approvedWeights)[0] || "Regular";
        issues.push({
          id: `issue-${node.id}-weight-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ruleId: "BG-TYPE-002",
          category: "typography",
          severity: "warning",
          title: "Unapproved font weight",
          description: `Font weight '${weight}' is not approved for this brand.`,
          nodeId: node.id,
          hostNodeId: node.hostId,
          location: { nodeName: node.name },
          actual: weight,
          expected: expectedWeight,
          confidence: 0.85,
          fix: {
            id: `fix-${node.id}-weight`,
            type: "replaceFontWeight",
            safety: "safe",
            nodeId: node.id,
            payload: { fontWeight: expectedWeight },
          },
          state: "open",
          createdAt: new Date().toISOString(),
        });
      }
    }

    return issues;
  }
}

// BG-TYPE-003: Approved Typography Size Scale
export class ApprovedFontSizeScaleRule implements BrandRule {
  id = "BG-TYPE-003";
  name = "Approved font size scale";
  category = "typography" as const;
  severity = "warning" as const;

  async evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]> {
    const issues: BrandIssue[] = [];
    const allNodes = flattenNodes(document.nodes);

    const approvedSizes = Array.from(
      new Set(context.kit.typography.flatMap((t) => t.sizes || []))
    ).sort((a, b) => a - b);

    const globalMinSize = Math.min(
      ...context.kit.typography.map((t) => t.minSize ?? 12)
    );

    for (const node of allNodes) {
      if (!node.visible || node.type !== "text" || !node.typography || !node.typography.fontSize) continue;

      const fontSize = node.typography.fontSize;

      // Check minimum size violation
      if (fontSize < globalMinSize) {
        issues.push({
          id: `issue-${node.id}-size-min-${Date.now()}`,
          ruleId: "BG-TYPE-003",
          category: "typography",
          severity: "error",
          title: "Typography size below minimum",
          description: `Font size ${fontSize}px is below minimum allowed size (${globalMinSize}px).`,
          nodeId: node.id,
          hostNodeId: node.hostId,
          location: { nodeName: node.name },
          actual: `${fontSize}px`,
          expected: `>= ${globalMinSize}px`,
          confidence: 0.95,
          fix: {
            id: `fix-${node.id}-size-min`,
            type: "setFontSize",
            safety: "safe",
            nodeId: node.id,
            payload: { fontSize: globalMinSize },
          },
          state: "open",
          createdAt: new Date().toISOString(),
        });
        continue;
      }

      // Check scale match
      if (approvedSizes.length > 0 && !approvedSizes.includes(fontSize)) {
        let closest = approvedSizes[0];
        let minDiff = Math.abs(fontSize - closest);
        for (const s of approvedSizes) {
          const diff = Math.abs(fontSize - s);
          if (diff < minDiff) {
            minDiff = diff;
            closest = s;
          }
        }

        issues.push({
          id: `issue-${node.id}-size-${Date.now()}`,
          ruleId: "BG-TYPE-003",
          category: "typography",
          severity: "warning",
          title: "Non-standard font size",
          description: `Font size ${fontSize}px is non-standard. Nearest size on scale is ${closest}px.`,
          nodeId: node.id,
          hostNodeId: node.hostId,
          location: { nodeName: node.name },
          actual: `${fontSize}px`,
          expected: `${closest}px`,
          confidence: 0.85,
          fix: {
            id: `fix-${node.id}-size`,
            type: "setFontSize",
            safety: "safe",
            nodeId: node.id,
            payload: { fontSize: closest },
          },
          state: "open",
          createdAt: new Date().toISOString(),
        });
      }
    }

    return issues;
  }
}

// BG-RADIUS-001: Corner Radius Rule
export class ApprovedRadiusRule implements BrandRule {
  id = "BG-RADIUS-001";
  name = "Approved corner radius";
  category = "radius" as const;
  severity = "warning" as const;

  async evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]> {
    const issues: BrandIssue[] = [];
    const approvedRadii = context.kit.radii || [];
    if (approvedRadii.length === 0) return issues;

    const allowedValues = approvedRadii.map((r) => r.value);
    const allNodes = flattenNodes(document.nodes);

    for (const node of allNodes) {
      if (!node.visible || node.radius === undefined) continue;
      const radiusVal = typeof node.radius === "number" ? node.radius : node.radius[0];
      if (radiusVal === undefined) continue;

      if (!allowedValues.includes(radiusVal)) {
        let closest = allowedValues[0];
        let minDiff = Math.abs(radiusVal - closest);
        for (const v of allowedValues) {
          const diff = Math.abs(radiusVal - v);
          if (diff < minDiff) {
            minDiff = diff;
            closest = v;
          }
        }

        issues.push({
          id: `issue-${node.id}-radius-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ruleId: "BG-RADIUS-001",
          category: "radius",
          severity: "warning",
          title: "Non-standard corner radius",
          description: `Corner radius ${radiusVal}px is non-standard. Nearest approved radius is ${closest}px.`,
          nodeId: node.id,
          hostNodeId: node.hostId,
          location: { nodeName: node.name },
          actual: `${radiusVal}px`,
          expected: `${closest}px`,
          confidence: 0.9,
          fix: {
            id: `fix-${node.id}-radius`,
            type: "setRadius",
            safety: "safe",
            nodeId: node.id,
            payload: { radius: closest },
          },
          state: "open",
          createdAt: new Date().toISOString(),
        });
      }
    }

    return issues;
  }
}

// BG-STROKE-001: Approved Stroke Width
export class ApprovedStrokeRule implements BrandRule {
  id = "BG-STROKE-001";
  name = "Approved stroke width";
  category = "stroke" as const;
  severity = "warning" as const;

  async evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]> {
    const issues: BrandIssue[] = [];
    const approvedStrokes = context.kit.strokes || [];
    if (approvedStrokes.length === 0) return issues;

    const allowedWidths = approvedStrokes.map((s) => s.width);
    const allNodes = flattenNodes(document.nodes);

    for (const node of allNodes) {
      if (!node.visible || !node.stroke || node.stroke.width === undefined || node.stroke.width === 0) continue;
      const strokeWidth = node.stroke.width;

      if (!allowedWidths.includes(strokeWidth)) {
        let closest = allowedWidths[0];
        let minDiff = Math.abs(strokeWidth - closest);
        for (const w of allowedWidths) {
          const diff = Math.abs(strokeWidth - w);
          if (diff < minDiff) {
            minDiff = diff;
            closest = w;
          }
        }

        issues.push({
          id: `issue-${node.id}-stroke-${Date.now()}`,
          ruleId: "BG-STROKE-001",
          category: "stroke",
          severity: "warning",
          title: "Unsupported stroke width",
          description: `Stroke width ${strokeWidth}px is non-standard. Nearest approved stroke width is ${closest}px.`,
          nodeId: node.id,
          hostNodeId: node.hostId,
          location: { nodeName: node.name },
          actual: `${strokeWidth}px`,
          expected: `${closest}px`,
          confidence: 0.9,
          fix: {
            id: `fix-${node.id}-stroke`,
            type: "setStroke",
            safety: "safe",
            nodeId: node.id,
            payload: { strokeWidth: closest },
          },
          state: "open",
          createdAt: new Date().toISOString(),
        });
      }
    }

    return issues;
  }
}

// BG-OPACITY-001: Opacity Rule
export class ApprovedOpacityRule implements BrandRule {
  id = "BG-OPACITY-001";
  name = "Approved opacity";
  category = "opacity" as const;
  severity = "warning" as const;

  async evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]> {
    const issues: BrandIssue[] = [];
    const approvedOpacities = context.kit.approvedOpacities || [];
    if (approvedOpacities.length === 0) return issues;

    const allNodes = flattenNodes(document.nodes);

    for (const node of allNodes) {
      if (!node.visible || node.opacity === undefined) continue;
      const opacityVal = Math.round(node.opacity * 100) / 100;

      if (!approvedOpacities.includes(opacityVal)) {
        let closest = approvedOpacities[0];
        let minDiff = Math.abs(opacityVal - closest);
        for (const op of approvedOpacities) {
          const diff = Math.abs(opacityVal - op);
          if (diff < minDiff) {
            minDiff = diff;
            closest = op;
          }
        }

        issues.push({
          id: `issue-${node.id}-opacity-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ruleId: "BG-OPACITY-001",
          category: "opacity",
          severity: "warning",
          title: "Non-standard opacity",
          description: `Opacity ${Math.round(opacityVal * 100)}% is non-standard. Nearest approved opacity is ${Math.round(closest * 100)}%.`,
          nodeId: node.id,
          hostNodeId: node.hostId,
          location: { nodeName: node.name },
          actual: `${Math.round(opacityVal * 100)}%`,
          expected: `${Math.round(closest * 100)}%`,
          confidence: 0.85,
          fix: {
            id: `fix-${node.id}-opacity`,
            type: "setOpacity",
            safety: "safe",
            nodeId: node.id,
            payload: { opacity: closest },
          },
          state: "open",
          createdAt: new Date().toISOString(),
        });
      }
    }

    return issues;
  }
}

// BG-NAME-001: Layer Naming Rule
export class LayerNamingRule implements BrandRule {
  id = "BG-NAME-001";
  name = "Layer naming convention";
  category = "naming" as const;
  severity = "info" as const;

  async evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]> {
    const issues: BrandIssue[] = [];
    const config = context.kit.layerNaming;
    if (!config || !config.enabled || !config.patterns || config.patterns.length === 0) return issues;

    const regexes = config.patterns.map((p) => new RegExp(p));
    const allNodes = flattenNodes(document.nodes);

    for (const node of allNodes) {
      if (!node.visible) continue;
      const name = node.name;

      if (config.ignoredPrefixes?.some((prefix) => name.startsWith(prefix))) {
        continue;
      }

      const matches = regexes.some((re) => re.test(name));
      if (!matches) {
        issues.push({
          id: `issue-${node.id}-naming-${Date.now()}`,
          ruleId: "BG-NAME-001",
          category: "naming",
          severity: "info",
          title: "Layer name does not follow brand convention",
          description: `Layer name '${name}' does not match pattern ${config.patterns[0]}.`,
          nodeId: node.id,
          hostNodeId: node.hostId,
          location: { nodeName: name },
          actual: name,
          expected: config.patterns[0],
          confidence: 0.7,
          state: "open",
          createdAt: new Date().toISOString(),
        });
      }
    }

    return issues;
  }
}

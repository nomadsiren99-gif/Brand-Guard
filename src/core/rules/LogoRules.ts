import { BrandRule, RuleContext } from "../models/rules.js";
import { BrandIssue } from "../models/issues.js";
import { Bounds, NormalizedDocument, NormalizedNode } from "../models/document.js";
import { LogoAsset } from "../models/brandKit.js";
import { flattenNodes } from "./BrandRule.js";

interface LogoInstance {
  node: NormalizedNode;
  asset: LogoAsset;
}

/**
 * Finds every visible node whose name matches one of the configured logo assets.
 * Invalid regex sources are skipped rather than thrown, so one bad kit entry
 * cannot take down the whole scan.
 */
export function findLogoInstances(
  document: NormalizedDocument,
  assets: LogoAsset[]
): LogoInstance[] {
  const compiled = assets.map((asset) => ({
    asset,
    regexes: asset.namePatterns
      .map((pattern) => {
        try {
          return new RegExp(pattern, "i");
        } catch {
          return null;
        }
      })
      .filter((re): re is RegExp => re !== null),
  }));

  const instances: LogoInstance[] = [];
  for (const node of flattenNodes(document.nodes)) {
    if (!node.visible) continue;
    for (const entry of compiled) {
      if (entry.regexes.some((re) => re.test(node.name))) {
        instances.push({ node, asset: entry.asset });
        break;
      }
    }
  }
  return instances;
}

function collectSubtreeIds(node: NormalizedNode, into: Set<string>): void {
  into.add(node.id);
  for (const child of node.children || []) {
    collectSubtreeIds(child, into);
  }
}

function expand(bounds: Bounds, margin: number): Bounds {
  return {
    x: bounds.x - margin,
    y: bounds.y - margin,
    width: bounds.width + margin * 2,
    height: bounds.height + margin * 2,
  };
}

function intersects(a: Bounds, b: Bounds): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function contains(outer: Bounds, inner: Bounds): boolean {
  return (
    outer.x <= inner.x &&
    outer.y <= inner.y &&
    outer.x + outer.width >= inner.x + inner.width &&
    outer.y + outer.height >= inner.y + inner.height
  );
}

function issueBase(node: NormalizedNode, suffix: string) {
  return {
    id: `issue-${node.id}-${suffix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    nodeId: node.id,
    hostNodeId: node.hostId,
    location: { nodeName: node.name },
    state: "open" as const,
    createdAt: new Date().toISOString(),
  };
}

// BG-LOGO-001: Logo minimum size
export class LogoMinimumSizeRule implements BrandRule {
  id = "BG-LOGO-001";
  name = "Logo minimum size";
  category = "logo" as const;
  severity = "error" as const;

  async evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]> {
    const issues: BrandIssue[] = [];
    const config = context.kit.logo;
    if (!config || !config.enabled || !config.assets?.length) return issues;

    for (const { node, asset } of findLogoInstances(document, config.assets)) {
      if (!node.bounds) continue;
      if (asset.minWidth === undefined && asset.minHeight === undefined) continue;

      const tooNarrow = asset.minWidth !== undefined && node.bounds.width < asset.minWidth;
      const tooShort = asset.minHeight !== undefined && node.bounds.height < asset.minHeight;
      if (!tooNarrow && !tooShort) continue;

      const violated = [
        tooNarrow ? `width ${node.bounds.width}px < ${asset.minWidth}px` : null,
        tooShort ? `height ${node.bounds.height}px < ${asset.minHeight}px` : null,
      ].filter(Boolean);

      issues.push({
        ...issueBase(node, "logo-size"),
        ruleId: "BG-LOGO-001",
        category: "logo",
        severity: "error",
        title: "Logo below minimum size",
        description: `'${asset.name}' is reproduced below its minimum legible size (${violated.join(", ")}).`,
        actual: `${node.bounds.width}x${node.bounds.height}px`,
        expected: `>= ${asset.minWidth ?? node.bounds.width}x${asset.minHeight ?? node.bounds.height}px`,
        confidence: 0.95,
        fix: {
          id: `fix-${node.id}-logo-size`,
          type: "resize",
          // Scaling up a placed logo can overlap neighbours, so a human confirms.
          safety: "review",
          nodeId: node.id,
          payload: {
            width: Math.max(node.bounds.width, asset.minWidth ?? 0),
            height: Math.max(node.bounds.height, asset.minHeight ?? 0),
          },
        },
      });
    }

    return issues;
  }
}

// BG-LOGO-002: Logo clear space
export class LogoClearSpaceRule implements BrandRule {
  id = "BG-LOGO-002";
  name = "Logo clear space";
  category = "logo" as const;
  severity = "warning" as const;

  async evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]> {
    const issues: BrandIssue[] = [];
    const config = context.kit.logo;
    if (!config || !config.enabled || !config.assets?.length) return issues;

    const allNodes = flattenNodes(document.nodes);

    for (const { node, asset } of findLogoInstances(document, config.assets)) {
      if (!node.bounds || !asset.clearSpace) continue;

      const exclusionZone = expand(node.bounds, asset.clearSpace);

      // The logo's own subtree never counts as an intrusion.
      const ownIds = new Set<string>();
      collectSubtreeIds(node, ownIds);

      const intruders = allNodes.filter((other) => {
        if (ownIds.has(other.id) || !other.visible || !other.bounds) return false;
        // Containers and backdrops enclosing the logo are not intrusions.
        if (other.type === "group" || other.type === "artboard") return false;
        if (contains(other.bounds, node.bounds!)) return false;
        // Anything already overlapping the logo itself is a separate problem.
        return intersects(other.bounds, exclusionZone);
      });

      if (intruders.length === 0) continue;

      issues.push({
        ...issueBase(node, "logo-clearspace"),
        ruleId: "BG-LOGO-002",
        category: "logo",
        severity: "warning",
        title: "Logo clear space violated",
        description: `${intruders.length} layer(s) intrude into the ${asset.clearSpace}px clear space around '${asset.name}': ${intruders
          .map((i) => `'${i.name}'`)
          .join(", ")}.`,
        actual: intruders.map((i) => i.name),
        expected: `${asset.clearSpace}px clear space on all sides`,
        confidence: 0.75,
        // Resolving an intrusion means moving other art; there is no safe automatic choice.
      });
    }

    return issues;
  }
}

// BG-LOGO-003: Logo aspect ratio
export class LogoAspectRatioRule implements BrandRule {
  id = "BG-LOGO-003";
  name = "Logo aspect ratio";
  category = "logo" as const;
  severity = "critical" as const;

  async evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]> {
    const issues: BrandIssue[] = [];
    const config = context.kit.logo;
    if (!config || !config.enabled || !config.assets?.length) return issues;

    for (const { node, asset } of findLogoInstances(document, config.assets)) {
      if (!node.bounds || !asset.aspectRatio || node.bounds.height === 0) continue;

      const actualRatio = node.bounds.width / node.bounds.height;
      const tolerance = asset.aspectRatioTolerance ?? 0.02;
      const deviation = Math.abs(actualRatio - asset.aspectRatio) / asset.aspectRatio;
      if (deviation <= tolerance) continue;

      issues.push({
        ...issueBase(node, "logo-ratio"),
        ruleId: "BG-LOGO-003",
        category: "logo",
        severity: "critical",
        title: "Logo distorted",
        description: `'${asset.name}' is stretched: aspect ratio ${actualRatio.toFixed(3)} deviates ${(deviation * 100).toFixed(1)}% from the required ${asset.aspectRatio.toFixed(3)}.`,
        actual: Number(actualRatio.toFixed(3)),
        expected: Number(asset.aspectRatio.toFixed(3)),
        confidence: 0.95,
        fix: {
          id: `fix-${node.id}-logo-ratio`,
          type: "resize",
          safety: "review",
          nodeId: node.id,
          payload: {
            // Preserve height and correct width, the less destructive of the two.
            width: Math.round(node.bounds.height * asset.aspectRatio * 100) / 100,
            height: node.bounds.height,
          },
        },
      });
    }

    return issues;
  }
}

// BG-LOGO-004: Logo color
export class LogoColorRule implements BrandRule {
  id = "BG-LOGO-004";
  name = "Logo color";
  category = "logo" as const;
  severity = "error" as const;

  async evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]> {
    const issues: BrandIssue[] = [];
    const config = context.kit.logo;
    if (!config || !config.enabled || !config.assets?.length) return issues;

    for (const { node, asset } of findLogoInstances(document, config.assets)) {
      const allowed = asset.allowedColors;
      if (!allowed || allowed.length === 0) continue;

      const actual = node.fill?.color?.hex;
      if (!actual) continue;

      const allowedUpper = allowed.map((hex) => hex.toUpperCase());
      if (allowedUpper.includes(actual.toUpperCase())) continue;

      issues.push({
        ...issueBase(node, "logo-color"),
        ruleId: "BG-LOGO-004",
        category: "logo",
        severity: "error",
        title: "Unapproved logo color",
        description: `'${asset.name}' uses ${actual}, which is not an approved logo colorway (${allowed.join(", ")}).`,
        actual,
        expected: allowed[0],
        confidence: 0.9,
        fix: {
          id: `fix-${node.id}-logo-color`,
          type: "replaceColor",
          safety: "safe",
          nodeId: node.id,
          payload: { color: allowed[0], colorName: `${asset.name} approved colorway` },
        },
      });
    }

    return issues;
  }
}

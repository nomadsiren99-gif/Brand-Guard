import { BrandRule, RuleContext } from "../models/rules.js";
import { BrandIssue } from "../models/issues.js";
import { NormalizedDocument } from "../models/document.js";
import { flattenNodes } from "./BrandRule.js";

/** Nearest value on the grid, or on an explicit scale when one is configured. */
function snap(value: number, baseUnit: number, allowedValues?: number[]): number {
  if (allowedValues && allowedValues.length > 0) {
    let closest = allowedValues[0];
    let minDiff = Math.abs(value - closest);
    for (const candidate of allowedValues) {
      const diff = Math.abs(value - candidate);
      if (diff < minDiff) {
        minDiff = diff;
        closest = candidate;
      }
    }
    return closest;
  }
  return Math.round(value / baseUnit) * baseUnit;
}

// BG-SPACE-001: Spacing grid alignment
export class SpacingGridRule implements BrandRule {
  id = "BG-SPACE-001";
  name = "Spacing grid alignment";
  category = "spacing" as const;
  severity = "warning" as const;

  async evaluate(
    document: NormalizedDocument,
    context: RuleContext
  ): Promise<BrandIssue[]> {
    const issues: BrandIssue[] = [];
    const config = context.kit.spacing;
    if (!config || !config.baseUnit || config.baseUnit <= 0) return issues;

    const tolerance = config.tolerance ?? 0.5;
    const allNodes = flattenNodes(document.nodes);

    for (const node of allNodes) {
      if (!node.visible || !node.bounds) continue;

      const axes: Array<{ key: string; label: string; value: number }> = [
        { key: "x", label: "X position", value: node.bounds.x },
        { key: "y", label: "Y position", value: node.bounds.y },
      ];

      if (config.checkDimensions) {
        axes.push(
          { key: "width", label: "Width", value: node.bounds.width },
          { key: "height", label: "Height", value: node.bounds.height }
        );
      }

      const offGrid = axes
        .map((axis) => ({ ...axis, snapped: snap(axis.value, config.baseUnit, config.allowedValues) }))
        .filter((axis) => Math.abs(axis.value - axis.snapped) > tolerance);

      if (offGrid.length === 0) continue;

      const detail = offGrid
        .map((axis) => `${axis.label} ${axis.value}px → ${axis.snapped}px`)
        .join(", ");

      const payload: Record<string, unknown> = {};
      for (const axis of offGrid) {
        payload[axis.key] = axis.snapped;
      }

      issues.push({
        id: `issue-${node.id}-spacing-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ruleId: "BG-SPACE-001",
        category: "spacing",
        severity: "warning",
        title: "Off-grid spacing",
        description: `Layer is not aligned to the ${config.baseUnit}px spacing grid (${detail}).`,
        nodeId: node.id,
        hostNodeId: node.hostId,
        location: { nodeName: node.name },
        actual: offGrid.map((axis) => `${axis.label} ${axis.value}px`).join(", "),
        expected: offGrid.map((axis) => `${axis.label} ${axis.snapped}px`).join(", "),
        confidence: 0.8,
        fix: {
          id: `fix-${node.id}-spacing`,
          type: offGrid.some((a) => a.key === "width" || a.key === "height") ? "resize" : "setPosition",
          // Moving geometry can shift a composition, so this needs a human look.
          safety: "review",
          nodeId: node.id,
          payload,
        },
        state: "open",
        createdAt: new Date().toISOString(),
      });
    }

    return issues;
  }
}

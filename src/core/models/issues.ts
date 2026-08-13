export type IssueSeverity = "critical" | "error" | "warning" | "info";

export type RuleCategory =
  | "color"
  | "typography"
  | "logo"
  | "spacing"
  | "radius"
  | "stroke"
  | "opacity"
  | "effects"
  | "naming"
  | "image"
  | "document"
  | "custom";

export interface FixInstruction {
  id: string;
  type:
    | "replaceColor"
    | "replaceFont"
    | "replaceFontWeight"
    | "setFontSize"
    | "setRadius"
    | "setStroke"
    | "setOpacity"
    | "replaceEffect"
    | "resize"
    | "setPosition"
    | "rename"
    | "custom";
  safety: "safe" | "review" | "manual";
  nodeId: string;
  payload: Record<string, unknown>;
}

export interface BrandIssue {
  id: string;
  ruleId: string;
  category: RuleCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  nodeId?: string;
  hostNodeId?: string;
  location?: {
    nodeName?: string;
    hierarchy?: string[];
  };
  actual?: unknown;
  expected?: unknown;
  confidence: number;
  fix?: FixInstruction;
  state: "open" | "ignored" | "fixed" | "resolved";
  createdAt: string;
}

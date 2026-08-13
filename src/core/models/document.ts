export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NormalizedColor {
  hex: string;
  r?: number;
  g?: number;
  b?: number;
}

export interface NormalizedPaint {
  type: "solid" | "gradient" | "pattern" | "none";
  color?: NormalizedColor;
}

export interface NormalizedStroke {
  width: number;
  color?: NormalizedColor;
  style?: string;
}

export interface NormalizedTypography {
  fontFamily: string;
  fontWeight?: string | number;
  fontSize?: number;
  fontStyle?: string;
  lineHeight?: number;
  letterSpacing?: number;
  color?: NormalizedColor;
}

export interface NormalizedEffect {
  type: "shadow" | "blur" | "glow" | "other";
  properties: Record<string, unknown>;
}

export interface NormalizedNode {
  id: string;
  hostId: string;
  name: string;
  type:
    | "text"
    | "shape"
    | "image"
    | "group"
    | "smartObject"
    | "vector"
    | "artboard"
    | "unknown";
  visible: boolean;
  parentId?: string;
  bounds?: Bounds;
  fill?: NormalizedPaint;
  stroke?: NormalizedStroke;
  opacity?: number;
  typography?: NormalizedTypography;
  effects?: NormalizedEffect[];
  radius?: number | number[];
  children?: NormalizedNode[];
  metadata?: Record<string, unknown>;
}

export interface NormalizedDocument {
  id: string;
  name: string;
  width: number;
  height: number;
  colorMode?: string;
  resolution?: number;
  nodes: NormalizedNode[];
  metadata?: Record<string, unknown>;
}

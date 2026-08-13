/**
 * Minimal shapes of the Illustrator DOM objects Brand Guard reads.
 * Illustrator exposes far more than this; only the properties the document
 * reader depends on are modelled, which also keeps test fixtures small.
 */

export interface IllustratorColor {
  typename?: string; // "RGBColor" | "CMYKColor" | "GrayColor" | "NoColor" | "SpotColor" | ...
  red?: number;
  green?: number;
  blue?: number;
  cyan?: number;
  magenta?: number;
  yellow?: number;
  black?: number;
  gray?: number;
  spot?: { color?: IllustratorColor };
}

export interface IllustratorTextFont {
  name?: string;
  family?: string;
  style?: string;
}

export interface IllustratorCharacterAttributes {
  textFont?: IllustratorTextFont;
  size?: number;
  leading?: number;
  tracking?: number;
  fillColor?: IllustratorColor;
}

export interface IllustratorTextRange {
  characterAttributes?: IllustratorCharacterAttributes;
}

export interface IllustratorPageItem {
  typename?: string; // "PathItem" | "TextFrame" | "GroupItem" | "PlacedItem" | ...
  uuid?: string;
  name?: string;
  hidden?: boolean;
  opacity?: number; // 0..100
  /** Illustrator order: [left, top, right, bottom] with a Y axis pointing up. */
  geometricBounds?: number[];
  visibleBounds?: number[];
  /** Writable geometry. `top` is on Illustrator's Y-up axis. */
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  filled?: boolean;
  fillColor?: IllustratorColor;
  stroked?: boolean;
  strokeColor?: IllustratorColor;
  strokeWidth?: number;
  contents?: string;
  textRange?: IllustratorTextRange;
  pageItems?: IllustratorPageItem[];
}

export interface IllustratorLayer {
  name?: string;
  visible?: boolean;
  pageItems?: IllustratorPageItem[];
  layers?: IllustratorLayer[];
}

export interface IllustratorDocument {
  name?: string;
  width?: number;
  height?: number;
  documentColorSpace?: string;
  layers?: IllustratorLayer[];
  pageItems?: IllustratorPageItem[];
}

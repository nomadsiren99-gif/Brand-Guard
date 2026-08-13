import { NormalizedColor } from "../models/document.js";

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0").toUpperCase();
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function normalizeColor(hexOrRgb: string | { r: number; g: number; b: number }): NormalizedColor {
  if (typeof hexOrRgb === "string") {
    const rgb = hexToRgb(hexOrRgb);
    const cleanHex = hexOrRgb.startsWith("#") ? hexOrRgb.toUpperCase() : `#${hexOrRgb.toUpperCase()}`;
    return {
      hex: cleanHex,
      r: rgb?.r,
      g: rgb?.g,
      b: rgb?.b,
    };
  } else {
    return {
      hex: rgbToHex(hexOrRgb.r, hexOrRgb.g, hexOrRgb.b),
      r: hexOrRgb.r,
      g: hexOrRgb.g,
      b: hexOrRgb.b,
    };
  }
}

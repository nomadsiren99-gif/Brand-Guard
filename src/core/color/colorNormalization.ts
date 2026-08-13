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

/**
 * Naive CMYK -> RGB conversion. Illustrator documents are frequently in CMYK
 * mode, and brand kits may store CMYK values. This is device-independent and
 * ignores ICC profiles, so it is an approximation used only to get colors into
 * a comparable RGB space.
 *
 * Accepts components as 0..100 (Illustrator's range) or 0..1.
 */
export function cmykToRgb(c: number, m: number, y: number, k: number): { r: number; g: number; b: number } {
  const scale = (n: number) => (n > 1 ? n / 100 : n);
  const cc = scale(c);
  const mm = scale(m);
  const yy = scale(y);
  const kk = scale(k);
  return {
    r: Math.round(255 * (1 - cc) * (1 - kk)),
    g: Math.round(255 * (1 - mm) * (1 - kk)),
    b: Math.round(255 * (1 - yy) * (1 - kk)),
  };
}

/**
 * Illustrator GrayColor uses 0..100 where 100 is black.
 */
export function grayToRgb(gray: number): { r: number; g: number; b: number } {
  const value = Math.round(255 * (1 - Math.max(0, Math.min(100, gray)) / 100));
  return { r: value, g: value, b: value };
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

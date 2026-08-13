import { NormalizedColor } from "../models/document.js";
import { BrandColor } from "../models/brandKit.js";
import { differenceCiede2000, parse } from "culori";

export interface ColorMatch {
  approved: boolean;
  matchedColor?: BrandColor;
  distance: number;
  isNearMatch: boolean;
}

/**
 * CIELAB Delta E 2000 color distance using `culori`.
 * Perceptual distance algorithm (0 = identical, < 2 = barely perceptible, < 10 = close match, > 25 = distinct).
 */
export class ColorMatcher {
  // Delta E 2000 threshold for near-match warning
  private deltaENearMatchThreshold = 12.0;

  findClosest(
    source: NormalizedColor,
    approvedColors: BrandColor[]
  ): ColorMatch {
    if (!approvedColors || approvedColors.length === 0) {
      return { approved: false, distance: Infinity, isNearMatch: false };
    }

    const sourceParsed = parse(source.hex);
    if (!sourceParsed) {
      return { approved: false, distance: Infinity, isNearMatch: false };
    }

    let closestColor: BrandColor | undefined;
    let minDeltaE = Infinity;

    for (const token of approvedColors) {
      if (!token.value.hex) continue;

      // Exact HEX match check
      if (token.value.hex.toUpperCase() === source.hex.toUpperCase()) {
        return {
          approved: true,
          matchedColor: token,
          distance: 0,
          isNearMatch: false,
        };
      }

      const tokenParsed = parse(token.value.hex);
      if (tokenParsed) {
        // Calculate CIELAB Delta E 2000 difference
        const deltaE = differenceCiede2000()(sourceParsed, tokenParsed);
        if (deltaE < minDeltaE) {
          minDeltaE = deltaE;
          closestColor = token;
        }
      }
    }

    const tolerance = closestColor?.tolerance ?? 2.5;
    const isApproved = minDeltaE <= tolerance;
    const isNearMatch = !isApproved && minDeltaE <= this.deltaENearMatchThreshold;

    return {
      approved: isApproved,
      matchedColor: closestColor,
      distance: minDeltaE,
      isNearMatch,
    };
  }
}

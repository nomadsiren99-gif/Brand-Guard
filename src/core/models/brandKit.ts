export interface BrandColor {
  id: string;
  name: string;
  value: {
    hex?: string;
    rgb?: { r: number; g: number; b: number };
    cmyk?: { c: number; m: number; y: number; k: number };
  };
  aliases?: string[];
  roles?: string[];
  tolerance?: number;
  allowedOpacity?: number[];
  autoFix: boolean;
}

export interface TypographyToken {
  id: string;
  name: string;
  fontFamilies: string[];
  fontWeights?: Array<string | number>;
  fontStyles?: string[];
  sizes?: number[];
  minSize?: number;
  maxSize?: number;
  lineHeights?: number[];
  letterSpacings?: number[];
  roles?: string[];
  replacements?: {
    fontFamily?: string;
    fontWeight?: string | number;
  };
}

export interface RadiusToken {
  name: string;
  value: number;
}

export interface StrokeToken {
  name: string;
  width: number;
  styles?: string[];
  colors?: string[];
}

export interface LayerNamingConfig {
  enabled: boolean;
  patterns: string[];
  ignoredPrefixes?: string[];
}

export interface SpacingConfig {
  /** Base grid unit in px. Positions are expected to be multiples of this value. */
  baseUnit: number;
  /** Allowed deviation in px before a position counts as off-grid. Defaults to 0.5. */
  tolerance?: number;
  /** Explicit spacing scale. When present it replaces the multiples-of-baseUnit check. */
  allowedValues?: number[];
  /** Also check width/height against the grid, not just x/y. Defaults to false. */
  checkDimensions?: boolean;
}

export interface LogoAsset {
  id: string;
  name: string;
  /** Regex sources matched against layer names to identify this logo. */
  namePatterns: string[];
  minWidth?: number;
  minHeight?: number;
  /** Required clear space around the logo in px. */
  clearSpace?: number;
  /** Expected width / height. Violations are reported as distortion. */
  aspectRatio?: number;
  /** Allowed relative deviation from aspectRatio. Defaults to 0.02 (2%). */
  aspectRatioTolerance?: number;
  /** Hex values the logo may be recolored to. Empty/undefined disables the check. */
  allowedColors?: string[];
}

export interface LogoConfig {
  enabled: boolean;
  assets: LogoAsset[];
}

export interface BrandKit {
  id: string;
  name: string;
  version: string;
  description?: string;
  colors: BrandColor[];
  typography: TypographyToken[];
  radii?: RadiusToken[];
  strokes?: StrokeToken[];
  approvedOpacities?: number[];
  layerNaming?: LayerNamingConfig;
  spacing?: SpacingConfig;
  logo?: LogoConfig;
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
  };
}

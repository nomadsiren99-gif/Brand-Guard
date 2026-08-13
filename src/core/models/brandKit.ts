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
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface PhotoshopLayer {
  id: number;
  name: string;
  kind: string; // "text", "pixel", "vector", "group", "smartObject", etc.
  visible: boolean;
  opacity: number; // 0..255 or 0..100
  bounds?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  textKey?: {
    text: string;
    fontPostScriptName?: string;
    fontName?: string;
    size?: { _unit: string; _value: number };
    color?: { red: number; green: number; blue: number };
  };
  fill?: {
    red: number;
    green: number;
    blue: number;
  };
}

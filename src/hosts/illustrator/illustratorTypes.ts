export interface IllustratorItem {
  id: string | number;
  name: string;
  typename: "PathItem" | "TextFrame" | "GroupItem" | "PlacedItem" | "RasterItem" | "CompoundPathItem" | "SymbolItem" | string;
  hidden?: boolean;
  opacity?: number; // 0..100
  position?: [number, number];
  width?: number;
  height?: number;
  fillColor?: {
    red: number;
    green: number;
    blue: number;
  };
  strokeColor?: {
    red: number;
    green: number;
    blue: number;
  };
  strokeWidth?: number;
  textRange?: {
    contents: string;
    font: string;
    size: number;
  };
  children?: IllustratorItem[];
}

export interface IllustratorDocumentDescriptor {
  name: string;
  width: number;
  height: number;
  rulerUnits?: string;
  items: IllustratorItem[];
}

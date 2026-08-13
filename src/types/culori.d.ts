declare module "culori" {
  export function parse(color: string): any;
  export function differenceCiede2000(): (c1: any, c2: any) => number;
}

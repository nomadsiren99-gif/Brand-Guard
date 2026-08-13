import { BrandRule } from "../models/rules.js";
import { BrandKit } from "../models/brandKit.js";
import {
  ApprovedColorRule,
  ApprovedTypographyRule,
  ApprovedFontWeightRule,
  ApprovedFontSizeScaleRule,
  ApprovedRadiusRule,
  ApprovedStrokeRule,
  ApprovedOpacityRule,
  LayerNamingRule,
} from "./BrandRule.js";
import { SpacingGridRule } from "./SpacingRules.js";
import {
  LogoMinimumSizeRule,
  LogoClearSpaceRule,
  LogoAspectRatioRule,
  LogoColorRule,
} from "./LogoRules.js";

export class RuleRegistry {
  private rules: Map<string, BrandRule> = new Map();

  constructor() {
    this.registerDefaultRules();
  }

  register(rule: BrandRule): void {
    this.rules.set(rule.id, rule);
  }

  get(id: string): BrandRule | undefined {
    return this.rules.get(id);
  }

  getAll(): BrandRule[] {
    return Array.from(this.rules.values());
  }

  getEnabledRules(_kit: BrandKit): BrandRule[] {
    return this.getAll();
  }

  private registerDefaultRules(): void {
    this.register(new ApprovedColorRule());
    this.register(new ApprovedTypographyRule());
    this.register(new ApprovedFontWeightRule());
    this.register(new ApprovedFontSizeScaleRule());
    this.register(new ApprovedRadiusRule());
    this.register(new ApprovedStrokeRule());
    this.register(new ApprovedOpacityRule());
    this.register(new SpacingGridRule());
    this.register(new LogoMinimumSizeRule());
    this.register(new LogoClearSpaceRule());
    this.register(new LogoAspectRatioRule());
    this.register(new LogoColorRule());
    this.register(new LayerNamingRule());
  }
}

import { BrandRule, RuleContext } from "../models/rules.js";
import { NormalizedDocument } from "../models/document.js";
import { BrandIssue } from "../models/issues.js";
import { BrandKit } from "../models/brandKit.js";
import { ColorMatcher } from "../color/ColorMatcher.js";

export interface RuleRunnerOptions {
  document: NormalizedDocument;
  kit: BrandKit;
  rules: BrandRule[];
  colorMatcher?: ColorMatcher;
}

export class RuleRunner {
  async run(options: RuleRunnerOptions): Promise<BrandIssue[]> {
    const { document, kit, rules, colorMatcher } = options;
    const context: RuleContext = {
      kit,
      colorMatcher: colorMatcher || new ColorMatcher(),
    };

    const issuePromises = rules.map((rule) => {
      try {
        return rule.evaluate(document, context);
      } catch (err) {
        console.error(`Error executing rule ${rule.id}:`, err);
        return Promise.resolve([]);
      }
    });

    const results = await Promise.all(issuePromises);
    return results.flat();
  }
}

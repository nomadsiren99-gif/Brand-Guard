# Brand Guard
## Photoshop Brand Compliance Plugin (Design Linter)

Brand Guard is a design linter for Adobe Photoshop. It checks design files
against defined Brand Kits (approved colors, typography, corner radii, stroke
widths, opacity, spacing, and logo rules) and provides actionable reports with
safe 1-click fixes.

### Architecture

```
Adobe Document (PSD)
      ↓
Host Adapter (PhotoshopAdapter)
      ↓
Normalized Document Model
      ↓
Brand Guard Rule Engine
      ↓
Issues & Safe Fix Instructions
      ↓
UXP Panel UI (React / Tailwind)
```

The rule engine never talks to Adobe APIs. The host adapter normalizes the
document into the shared model in `src/core/models/document.ts`, and every rule
runs against that model alone. The plugin currently targets Photoshop only.

### Setup & Testing

Requires Node 18 or newer.

```bash
npm install
```

```bash
npm test
```

```bash
npm run typecheck
```

### Running the panel

For UI work, the panel runs in a plain browser against a built-in demo document:

```bash
npm run dev
```

To build and package the plugin:

```bash
npm run package:ccx
```

This produces `build/photoshop-uxp/` — a complete, loadable plugin folder for
the [UXP Developer Tool](https://developer.adobe.com/photoshop/uxp/devtool/) —
and `build/BrandGuard.ccx`, the packaged archive. Both are build output and are
git-ignored.

> **Note:** `index.html` at the repository root is Vite's build entry and must
> keep pointing at `/src/ui/main.tsx`. If a built `index.html` is committed over
> it, every later build silently re-bundles the previous bundle instead of the
> source.

### Rules

| ID | Rule | Category | Default severity |
| --- | --- | --- | --- |
| `BG-COLOR-001` | Unapproved color | color | error |
| `BG-COLOR-002` | Near-match brand color | color | warning |
| `BG-TYPE-001` | Approved font family | typography | error |
| `BG-TYPE-002` | Approved font weight | typography | warning |
| `BG-TYPE-003` | Approved font size scale / minimum size | typography | warning / error |
| `BG-RADIUS-001` | Approved corner radius | radius | warning |
| `BG-STROKE-001` | Approved stroke width | stroke | warning |
| `BG-OPACITY-001` | Approved opacity | opacity | warning |
| `BG-SPACE-001` | Spacing grid alignment | spacing | warning |
| `BG-LOGO-001` | Logo minimum size | logo | error |
| `BG-LOGO-002` | Logo clear space | logo | warning |
| `BG-LOGO-003` | Logo aspect ratio (distortion) | logo | critical |
| `BG-LOGO-004` | Approved logo colorway | logo | error |
| `BG-NAME-001` | Layer naming convention | naming | info |

Every fix carries a safety level: `safe` fixes change one property in place,
`review` fixes move or resize geometry and are worth a human glance, and
`manual` issues have no automatic remedy. Bulk "Fix Safe" applies only `safe`
fixes, so it never shifts a composition. `BG-LOGO-002` emits no fix at all,
because clearing space means moving other artwork.

### Brand Kit

Brand Kits are JSON documents validated against
`schemas/brand-kit.schema.json`. See `examples/acme-brand.brandguard.json` for a
complete kit. The spacing and logo sections drive the newer rules:

```jsonc
{
  "spacing": {
    "baseUnit": 8,           // positions must be multiples of this
    "tolerance": 0.5,        // px of slack before flagging
    "allowedValues": [],     // optional explicit scale, replaces the grid check
    "checkDimensions": false // also check width/height, not just x/y
  },
  "logo": {
    "enabled": true,
    "assets": [
      {
        "id": "acme-primary-logo",
        "name": "Acme Primary Logo",
        "namePatterns": ["logo", "acme-mark"], // regex, matched against layer names
        "minWidth": 96,
        "minHeight": 24,
        "clearSpace": 24,
        "aspectRatio": 4,
        "aspectRatioTolerance": 0.02,
        "allowedColors": ["#0066FF", "#001B44", "#FFFFFF"]
      }
    ]
  }
}
```

Rules that depend on optional kit sections stay inert when those sections are
absent, so an older kit keeps working unchanged.

### Project layout

```
src/core/      Host-independent domain model, rules, scoring, ignore handling
src/hosts/     Photoshop adapter
src/kits/      Brand Kit import, export, validation, storage
src/ui/        React UXP panel
schemas/       Brand Kit JSON schema
examples/      Sample Brand Kit
tests/         Vitest unit and integration tests
```

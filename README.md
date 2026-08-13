# Brand Guard
## Photoshop + Illustrator Brand Compliance Plugin (Design Linter)

Brand Guard is a host-independent design linter for Adobe Photoshop and Illustrator. It continuously checks design files against defined Brand Kits (approved colors, typography, corner radii, stroke widths, opacity, spacing, and logo rules) and provides actionable reports with safe 1-click fixes.

### Architecture

```
Adobe Document (PSD / AI)
      ↓
Host Adapter (PhotoshopAdapter / IllustratorAdapter)
      ↓
Normalized Document Model
      ↓
Brand Guard Rule Engine
      ↓
Issues & Safe Fix Instructions
      ↓
UXP Panel UI (React / Tailwind)
```

### Setup & Testing

```bash
# Install dependencies
npm install

# Run unit & integration tests
npm test
```

### First Milestone Features

- Host-independent core domain model & document normalizer
- Brand Kit schema definition (`schemas/brand-kit.schema.json`)
- Perceptual color matcher with near-match color detection (e.g. `#0865FA` → `#0066FF`)
- Rules engine:
  - `BG-COLOR-001` (Exact approved colors)
  - `BG-COLOR-002` (Near-match brand colors)
  - `BG-TYPE-001` (Approved font families)
  - `BG-RADIUS-001` (Approved corner radii)
  - `BG-OPACITY-001` (Approved opacities)
- Ignore system (by issue, node, rule)
- Normalized compliance scoring algorithm

import { NormalizedDocument } from "../models/document.js";

export const demoDocument: NormalizedDocument = {
  id: "demo-doc-1",
  name: "Homepage Campaign.psd",
  width: 1440,
  height: 900,
  colorMode: "RGB",
  resolution: 72,
  nodes: [
    {
      id: "hero-heading",
      hostId: "layer-101",
      name: "Hero / Heading",
      type: "text",
      visible: true,
      bounds: { x: 100, y: 120, width: 800, height: 64 },
      opacity: 1.0,
      typography: {
        fontFamily: "Arial",
        fontWeight: "Bold",
        fontSize: 64,
      },
    },
    {
      id: "hero-desc",
      hostId: "layer-102",
      name: "Hero / Description",
      type: "text",
      visible: true,
      bounds: { x: 100, y: 200, width: 600, height: 48 },
      opacity: 0.75, // Non-standard opacity (approved: 0.2, 0.4, 0.6, 0.8, 1.0)
      typography: {
        fontFamily: "Helvetica Neue",
        fontWeight: "Regular",
        fontSize: 16,
      },
    },
    {
      id: "cta-bg",
      hostId: "layer-103",
      name: "Hero / CTA / Background",
      type: "shape",
      visible: true,
      bounds: { x: 100, y: 280, width: 200, height: 48 },
      fill: {
        type: "solid",
        color: { hex: "#1E75FF" }, // Near-match to Acme Blue (#0066FF)
      },
      radius: 13, // Non-standard radius (approved: 0, 4, 8, 16, 999)
      opacity: 1.0,
    },
    {
      id: "brand-logo",
      hostId: "layer-104",
      name: "Header / Logo",
      type: "image",
      visible: true,
      // 150x30 => ratio 5.0, stretched from the required 4.0
      bounds: { x: 96, y: 40, width: 150, height: 30 },
      fill: {
        type: "solid",
        color: { hex: "#FF6B00" }, // Unapproved logo colorway
      },
      opacity: 1.0,
    },
    {
      id: "promo-badge",
      hostId: "layer-105",
      name: "Header / Promo Badge",
      type: "shape",
      visible: true,
      // Sits 10px right of the logo, inside its 24px clear space
      bounds: { x: 256, y: 40, width: 64, height: 32 },
      fill: {
        type: "solid",
        color: { hex: "#0066FF" },
      },
      opacity: 1.0,
    },
  ],
};

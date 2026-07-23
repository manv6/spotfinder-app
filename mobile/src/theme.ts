// Color palette ported 1:1 from the original SpotFinder web app (CSS custom properties).
export const colors = {
  bg: '#06080c',
  surface: '#0f1219',
  surface2: '#171c26',
  surface3: '#1e2432',
  border: '#262d3d',
  borderLight: '#333c50',
  text: '#eaecf2',
  textMid: '#a0a8bc',
  textDim: '#5c6478',
  accent: '#38bdf8',
  accentSoft: 'rgba(56, 189, 248, 0.12)',
  accentGlow: 'rgba(56, 189, 248, 0.25)',
  green: '#4ade80',
  greenSoft: 'rgba(74, 222, 128, 0.12)',
  greenGlow: 'rgba(74, 222, 128, 0.3)',
  orange: '#fb923c',
  red: '#f87171',
  purple: '#a78bfa',
} as const;

// Canvas-specific shades used only inside the Skia map renderer.
export const mapColors = {
  canvasBg: '#06080c',
  venueFill: '#0b0e14',
  grid: '#141922',
  gridLabel: '#2a3244',
  venueBorder: '#262d3d',
  crosshair: '#1a2030',
  scaleBar: '#3a4358',
  compassRose: '#2a3244',
  compassLabel: '#4a5568',
  navLine: 'rgba(56,189,248,0.35)',
} as const;

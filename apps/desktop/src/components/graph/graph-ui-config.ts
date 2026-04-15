export const GRAPH_VISUAL_CONFIG = {
  node: {
    baseSize: 3,
    hoverScale: 1.2,
    activeScale: 1.5,
    labelThreshold: 6,
  },
  link: {
    baseWidth: 1,
    activeWidth: 2.5,
    inactiveOpacity: 0.05,
    curvature: {
      semantic: 0.12,
      tag: 0.18,
      default: 0.02,
    },
  },
  particles: {
    wikilink: { count: 3, speed: 0.007 },
    import: { count: 4, speed: 0.01 },
    semantic: { count: 2, speed: 0.004 },
  },
  camera: {
    minDistance: 40,
    maxDistance: 1800,
    focusDistance: 120,
  },
};

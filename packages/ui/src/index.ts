export type UiPrimitiveSize = "xs" | "sm" | "md" | "lg";

export type UiSurfaceTone = "default" | "muted" | "accent";

export type UiSurfaceProps = {
  size?: UiPrimitiveSize;
  tone?: UiSurfaceTone;
  rounded?: boolean;
};

export const UI_VERSION = "0.2.0";

export function getUiSurfaceClassName(input: UiSurfaceProps = {}) {
  const {
    size = "md",
    tone = "default",
    rounded = true,
  } = input;

  const sizeClassMap: Record<UiPrimitiveSize, string> = {
    xs: "ui-surface--xs",
    sm: "ui-surface--sm",
    md: "ui-surface--md",
    lg: "ui-surface--lg",
  };

  const toneClassMap: Record<UiSurfaceTone, string> = {
    default: "ui-surface--default",
    muted: "ui-surface--muted",
    accent: "ui-surface--accent",
  };

  return [
    "ui-surface",
    sizeClassMap[size],
    toneClassMap[tone],
    rounded ? "ui-surface--rounded" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// apps/desktop/src/components/workspace/FloatingPanel.tsx
import React from "react";

type FloatingPanelProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  toolbar?: React.ReactNode;
  subdued?: boolean;
  compact?: boolean;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function FloatingPanel({
  title,
  subtitle,
  children,
  className,
  toolbar,
  subdued = false,
  compact = false,
}: FloatingPanelProps) {
  return (
    <section
      className={cn(
        "floating-panel",
        subdued && "floating-panel--subdued",
        compact && "floating-panel--compact",
        className,
      )}
    >
      {(title || subtitle || toolbar) && (
        <header className="floating-panel__header">
          <div className="floating-panel__meta">
            {title ? <p className="floating-panel__title">{title}</p> : null}
            {subtitle ? <p className="floating-panel__subtitle">{subtitle}</p> : null}
          </div>
          {toolbar ? <div className="floating-panel__toolbar">{toolbar}</div> : null}
        </header>
      )}

      <div className="floating-panel__body">{children}</div>
    </section>
  );
}

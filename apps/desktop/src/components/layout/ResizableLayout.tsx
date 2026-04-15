import { useRef, useState } from "react";

type Props = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
};

export default function ResizableLayout({ left, center, right }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(320);

  const startDrag = (side: "left" | "right", e: React.PointerEvent) => {
    e.preventDefault();

    const startX = e.clientX;

    const onMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startX;

      if (side === "left") {
        setLeftWidth((w) => Math.max(200, w + delta));
      } else {
        setRightWidth((w) => Math.max(260, w - delta));
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={containerRef}
      className="resizable-layout"
      style={{
        gridTemplateColumns: `${leftWidth}px 6px minmax(0,1fr) 6px ${rightWidth}px`,
      }}
    >
      <div className="panel-area">{left}</div>

      <div
        className="resize-handle"
        onPointerDown={(e) => startDrag("left", e)}
      />

      <div className="panel-area">{center}</div>

      <div
        className="resize-handle"
        onPointerDown={(e) => startDrag("right", e)}
      />

      <div className="panel-area">{right}</div>
    </div>
  );
}

import React, { useMemo } from "react";

type VaultAsset = {
  id: string;
  name: string;
  relativePath: string;
  links: string[];
  tags: string[];
};

export function BacklinksRail({
  selectedPath,
  assets,
  onOpen,
}: {
  selectedPath: string | null;
  assets: VaultAsset[];
  onOpen: (relativePath: string) => void;
}) {
  const backlinks = useMemo(() => {
    if (!selectedPath) return [];
    const baseName = selectedPath.replace(/\.md$/i, "").split("/").pop() || selectedPath;

    return assets.filter((asset) => {
      return asset.links.some((link) => {
        const normalizedLink = link.replace(/\.md$/i, "").split("/").pop() || link;
        return normalizedLink === baseName;
      });
    });
  }, [assets, selectedPath]);

  return (
    <section className="panel">
      <div className="panel__head">
        <p className="panel__kicker">Backlinks</p>
        <span className="panel__meta">{backlinks.length}</span>
      </div>

      <div className="stack-sm">
        {backlinks.length ? (
          backlinks.map((item) => (
            <button key={item.id} className="list-item" onClick={() => onOpen(item.relativePath)}>
              <span className="list-item__content">
                <strong>{item.name}</strong>
                <span>{item.relativePath}</span>
              </span>
            </button>
          ))
        ) : (
          <div className="muted">No backlinks detected.</div>
        )}
      </div>
    </section>
  );
}

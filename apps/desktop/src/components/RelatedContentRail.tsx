import React, { useMemo } from "react";

type VaultAsset = {
  id: string;
  name: string;
  relativePath: string;
  tags: string[];
};

export function RelatedContentRail({
  selectedAsset,
  assets,
  onOpen,
}: {
  selectedAsset: VaultAsset | null;
  assets: VaultAsset[];
  onOpen: (relativePath: string) => void;
}) {
  const related = useMemo(() => {
    if (!selectedAsset) return [];

    return assets
      .filter((asset) => asset.relativePath !== selectedAsset.relativePath)
      .map((asset) => {
        const overlap = asset.tags.filter((tag) => selectedAsset.tags.includes(tag)).length;
        return { asset, overlap };
      })
      .filter((entry) => entry.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 8);
  }, [assets, selectedAsset]);

  return (
    <section className="panel">
      <div className="panel__head">
        <p className="panel__kicker">Related Content</p>
        <span className="panel__meta">{related.length}</span>
      </div>

      <div className="stack-sm">
        {related.length ? (
          related.map(({ asset, overlap }) => (
            <button key={asset.id} className="list-item" onClick={() => onOpen(asset.relativePath)}>
              <span className="list-item__content">
                <strong>{asset.name}</strong>
                <span>{asset.relativePath}</span>
              </span>
              <span className="list-item__meta">{overlap} overlap</span>
            </button>
          ))
        ) : (
          <div className="muted">No related content found.</div>
        )}
      </div>
    </section>
  );
}

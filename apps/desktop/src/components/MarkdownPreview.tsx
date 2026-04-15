import React, { Fragment, useMemo } from "react";

type MarkdownPreviewProps = {
  raw: string;
  onOpenWikiLink?: (target: string) => void;
};

function renderInline(text: string, onOpenWikiLink?: (target: string) => void) {
  const nodes: React.ReactNode[] = [];
  const regex = /(\[\[(.*?)\]\]|`([^`]+)`|(#[\p{L}\p{N}_/-]+)|\[(.*?)\]\((.*?)\))/gu;

  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(text);

  while (match) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`text-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>
      );
    }

    const full = match[1];
    const wiki = match[2];
    const inlineCode = match[3];
    const tag = match[4];
    const linkLabel = match[5];
    const linkHref = match[6];

    if (wiki) {
      nodes.push(
        <button
          key={`wiki-${match.index}`}
          className="md-inline-link md-inline-link--wiki"
          onClick={() => onOpenWikiLink?.(wiki)}
        >
          [[{wiki}]]
        </button>
      );
    } else if (inlineCode) {
      nodes.push(
        <code key={`code-${match.index}`} className="md-inline-code">
          {inlineCode}
        </code>
      );
    } else if (tag) {
      nodes.push(
        <span key={`tag-${match.index}`} className="pill pill--active">
          {tag}
        </span>
      );
    } else if (linkLabel && linkHref) {
      nodes.push(
        <a
          key={`link-${match.index}`}
          className="md-inline-link"
          href={linkHref}
          target="_blank"
          rel="noreferrer"
        >
          {linkLabel}
        </a>
      );
    } else {
      nodes.push(<Fragment key={`fallback-${match.index}`}>{full}</Fragment>);
    }

    lastIndex = match.index + full.length;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`tail-${lastIndex}`}>{text.slice(lastIndex)}</Fragment>);
  }

  return nodes;
}

export function MarkdownPreview({ raw, onOpenWikiLink }: MarkdownPreviewProps) {
  const content = useMemo(() => {
    const lines = raw.replace(/\r\n/g, "\n").split("\n");
    const blocks: React.ReactNode[] = [];

    let i = 0;

    while (i < lines.length) {
      const line = lines[i] ?? "";

      if (!line.trim()) {
        i += 1;
        continue;
      }

      if (line.startsWith("```")) {
        const language = line.replace("```", "").trim();
        const codeLines: string[] = [];
        i += 1;

        while (i < lines.length && !lines[i]?.startsWith("```")) {
          codeLines.push(lines[i] ?? "");
          i += 1;
        }

        i += 1;

        blocks.push(
          <pre className="md-codeblock" key={`code-${i}`}>
            {language ? <div className="md-codeblock__lang">{language}</div> : null}
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        continue;
      }

      const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const className = `md-heading md-heading--h${level}`;

        if (level === 1) {
          blocks.push(
            <h1 className={className} key={`h-${i}`}>
              {renderInline(text, onOpenWikiLink)}
            </h1>
          );
        } else if (level === 2) {
          blocks.push(
            <h2 className={className} key={`h-${i}`}>
              {renderInline(text, onOpenWikiLink)}
            </h2>
          );
        } else if (level === 3) {
          blocks.push(
            <h3 className={className} key={`h-${i}`}>
              {renderInline(text, onOpenWikiLink)}
            </h3>
          );
        } else {
          blocks.push(
            <h4 className={className} key={`h-${i}`}>
              {renderInline(text, onOpenWikiLink)}
            </h4>
          );
        }

        i += 1;
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        const items: string[] = [];

        while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? "")) {
          items.push((lines[i] ?? "").replace(/^[-*]\s+/, ""));
          i += 1;
        }

        blocks.push(
          <ul className="md-list" key={`ul-${i}`}>
            {items.map((item, index) => (
              <li key={`${item}-${index}`}>{renderInline(item, onOpenWikiLink)}</li>
            ))}
          </ul>
        );
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items: string[] = [];

        while (i < lines.length && /^\d+\.\s+/.test(lines[i] ?? "")) {
          items.push((lines[i] ?? "").replace(/^\d+\.\s+/, ""));
          i += 1;
        }

        blocks.push(
          <ol className="md-list md-list--ordered" key={`ol-${i}`}>
            {items.map((item, index) => (
              <li key={`${item}-${index}`}>{renderInline(item, onOpenWikiLink)}</li>
            ))}
          </ol>
        );
        continue;
      }

      const paragraphLines: string[] = [];
      while (
        i < lines.length &&
        lines[i]?.trim() &&
        !lines[i]?.startsWith("```") &&
        !/^(#{1,6})\s+/.test(lines[i] ?? "") &&
        !/^[-*]\s+/.test(lines[i] ?? "") &&
        !/^\d+\.\s+/.test(lines[i] ?? "")
      ) {
        paragraphLines.push(lines[i] ?? "");
        i += 1;
      }

      blocks.push(
        <p className="md-paragraph" key={`p-${i}`}>
          {renderInline(paragraphLines.join(" "), onOpenWikiLink)}
        </p>
      );
    }

    return blocks;
  }, [raw, onOpenWikiLink]);

  return <div className="markdown-preview">{content}</div>;
}

export type PreviewMode =
  | "markdown-preview"
  | "code-view"
  | "pdf-placeholder"
  | "image-placeholder"
  | "table-placeholder"
  | "text-view"
  | "unknown";

export function getPreviewMode(type: string): PreviewMode {
  switch (type) {
    case "markdown":
      return "markdown-preview";
    case "code":
    case "script":
    case "json":
      return "code-view";
    case "pdf":
      return "pdf-placeholder";
    case "csv":
      return "table-placeholder";
    case "image":
      return "image-placeholder";
    case "text":
      return "text-view";
    default:
      return "unknown";
  }
}

export function renderMarkdownPreview(raw: string) {
  return raw
    .replace(/^###### (.*)$/gm, "<h6>$1</h6>")
    .replace(/^##### (.*)$/gm, "<h5>$1</h5>")
    .replace(/^#### (.*)$/gm, "<h4>$1</h4>")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[\[(.*?)\]\]/g, `<span class="preview-wikilink">[[$1]]</span>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");
}

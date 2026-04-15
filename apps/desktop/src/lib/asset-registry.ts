export type BrainAssetType =
  | "markdown"
  | "code"
  | "script"
  | "pdf"
  | "image"
  | "json"
  | "csv"
  | "text"
  | "unknown";

export type AssetRegistryEntry = {
  type: BrainAssetType;
  label: string;
  icon: string;
  previewMode: "editor" | "code" | "pdf" | "image" | "table" | "text" | "unknown";
  editable: boolean;
};

const CODE_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "css",
  "scss",
  "html",
  "sql",
  "py",
  "rb",
  "java",
  "go",
  "rs",
  "php",
  "c",
  "cpp",
  "h",
  "hpp",
  "swift",
  "kt",
  "sh",
  "zsh",
  "bash",
  "yml",
  "yaml",
]);

const SCRIPT_EXTENSIONS = new Set(["sh", "zsh", "bash", "ps1"]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg"]);
const TEXT_EXTENSIONS = new Set(["txt", "mdx", "rtf", "log"]);

export function getExtension(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  const lastDot = normalized.lastIndexOf(".");
  if (lastDot === -1) return "";
  return normalized.slice(lastDot + 1);
}

export function getBrainAssetType(fileName: string): BrainAssetType {
  const ext = getExtension(fileName);

  if (ext === "md") return "markdown";
  if (ext === "pdf") return "pdf";
  if (ext === "json") return "json";
  if (ext === "csv") return "csv";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (SCRIPT_EXTENSIONS.has(ext)) return "script";
  if (CODE_EXTENSIONS.has(ext)) return "code";
  if (TEXT_EXTENSIONS.has(ext)) return "text";

  return "unknown";
}

export function getAssetRegistryEntry(fileName: string): AssetRegistryEntry {
  const type = getBrainAssetType(fileName);

  switch (type) {
    case "markdown":
      return {
        type,
        label: "Markdown",
        icon: "✦",
        previewMode: "editor",
        editable: true,
      };
    case "code":
      return {
        type,
        label: "Code",
        icon: "</>",
        previewMode: "code",
        editable: true,
      };
    case "script":
      return {
        type,
        label: "Script",
        icon: "⌘",
        previewMode: "code",
        editable: true,
      };
    case "pdf":
      return {
        type,
        label: "PDF",
        icon: "PDF",
        previewMode: "pdf",
        editable: false,
      };
    case "image":
      return {
        type,
        label: "Image",
        icon: "◩",
        previewMode: "image",
        editable: false,
      };
    case "json":
      return {
        type,
        label: "JSON",
        icon: "{ }",
        previewMode: "code",
        editable: true,
      };
    case "csv":
      return {
        type,
        label: "CSV",
        icon: "▦",
        previewMode: "table",
        editable: true,
      };
    case "text":
      return {
        type,
        label: "Text",
        icon: "TXT",
        previewMode: "text",
        editable: true,
      };
    default:
      return {
        type,
        label: "Unknown",
        icon: "?",
        previewMode: "unknown",
        editable: false,
      };
  }
}

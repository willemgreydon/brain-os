export type LegalDocument = {
  id: string;
  title: string;
  summary: string;
  body: string;
};

export const legalDocuments: LegalDocument[] = [
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    summary: "How Brain OS handles local data, optional cloud flows, telemetry, and user controls.",
    body: `# Privacy Policy

Brain OS is designed as a local-first product. By default, documents remain on the user's device.

## Core Principles

- local-first storage
- explicit consent for cloud features
- explicit consent for AI data usage
- user-controlled export and deletion

## Controls

- telemetry toggle
- AI consent toggle
- export my data
- delete my data
`,
  },
  {
    id: "terms-of-service",
    title: "Terms of Service",
    summary: "Platform usage terms for desktop, web, and future account-based services.",
    body: `# Terms of Service

Brain OS provides local-first knowledge tooling and may later include sync, AI, and subscription services.

## Usage

Users remain responsible for the content they store, export, and process.`,
  },
  {
    id: "imprint",
    title: "Imprint / Legal Notice",
    summary: "Required legal notice route placeholder for web and trust layer.",
    body: `# Imprint / Legal Notice

This route exists as part of the platform trust layer and must be accessible on web surfaces.`,
  },
  {
    id: "ai-disclosure",
    title: "AI Use & Limitations",
    summary: "Explains AI-generated assistance, uncertainty, and human review expectations.",
    body: `# AI Use & Limitations

AI in Brain OS is intended as cognitive augmentation, not source-of-truth authority.

## Important

- outputs may be incomplete
- outputs may be wrong
- user review is required`,
  },
  {
    id: "data-export",
    title: "Data Export & Portability",
    summary: "Documents how users can export notes, settings, and future account data.",
    body: `# Data Export & Portability

Users should be able to export their knowledge assets, metadata, and future account-linked datasets.`,
  },
  {
    id: "account-deletion",
    title: "Account Deletion",
    summary: "Required route for account deletion and associated platform handling.",
    body: `# Account Deletion

If Brain OS supports account creation, account deletion must be available in-app and on the web where required.`,
  },
  {
    id: "licenses",
    title: "Third-Party Licenses",
    summary: "Third-party software and package attribution.",
    body: `# Third-Party Licenses

This section documents third-party dependencies and license information.`,
  },
];

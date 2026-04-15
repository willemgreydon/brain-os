export type AccountTier = "guest" | "free" | "pro" | "team";

export type AccountState = {
  tier: AccountTier;
  isAuthenticated: boolean;
  email: string | null;
  displayName: string | null;
  syncEnabled: boolean;
  aiHistoryEnabled: boolean;
  deviceCount: number;
  seats?: number;
  workspaceCount?: number;
};

export const defaultAccountState: AccountState = {
  tier: "guest",
  isAuthenticated: false,
  email: null,
  displayName: null,
  syncEnabled: false,
  aiHistoryEnabled: false,
  deviceCount: 1,
  seats: 1,
  workspaceCount: 1,
};

export function getTierDescription(tier: AccountTier) {
  switch (tier) {
    case "guest":
      return "Local-only mode with no sign-in requirement.";
    case "free":
      return "Signed-in lightweight usage with limited cloud capability.";
    case "pro":
      return "Advanced sync, AI history, export, and higher platform limits.";
    case "team":
      return "Shared workspaces, admin controls, seats, and organizational governance.";
    default:
      return "";
  }
}

declare global {
  interface Window {
    brainDesktop: {
      platform: string;
      appName: string;
      selectVault: () => Promise<any>;
      refreshVault: () => Promise<any>;
      useSampleVault: () => Promise<any>;
      onVaultUpdated: (callback: (payload: any) => void) => () => void;
    };
  }
}

export {};

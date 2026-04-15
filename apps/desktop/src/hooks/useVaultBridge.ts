import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

export function useVaultBridge() {
  const setGraphPayload = useAppStore((state) => state.setGraphPayload);
  const [status, setStatus] = useState<"booting" | "ready" | "loading" | "error">("booting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const start = async () => {
      try {
        setStatus("loading");
        const payload = await window.brainDesktop.useSampleVault();
        if (!mounted) return;
        setGraphPayload(payload);
        setStatus("ready");
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to boot desktop bridge.");
        setStatus("error");
      }
    };
    start();

    const dispose = window.brainDesktop.onVaultUpdated((payload) => {
      setGraphPayload(payload);
      setStatus("ready");
    });

    return () => {
      mounted = false;
      dispose();
    };
  }, [setGraphPayload]);

  const chooseVault = async () => {
    try {
      setStatus("loading");
      setError(null);
      const payload = await window.brainDesktop.selectVault();
      if (!payload) {
        setStatus("ready");
        return;
      }
      setGraphPayload(payload);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vault import failed.");
      setStatus("error");
    }
  };

  const refreshVault = async () => {
    try {
      setStatus("loading");
      setError(null);
      const payload = await window.brainDesktop.refreshVault();
      if (payload) setGraphPayload(payload);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vault refresh failed.");
      setStatus("error");
    }
  };

  return { status, error, chooseVault, refreshVault };
}

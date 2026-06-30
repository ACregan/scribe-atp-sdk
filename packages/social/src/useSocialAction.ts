import { useEffect, useRef, useCallback } from "react";

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 20; // 30 seconds

export interface SocialActionConfig {
  isActive: boolean;
  action: string;
  endpoint: string;
  serviceUrl: string;
  onActivated: () => void;
  resetAfterMs?: number;
  setInactive?: () => void;
  buildParams: (token: string) => URLSearchParams;
}

export function useSocialAction({
  isActive,
  action,
  endpoint,
  serviceUrl,
  onActivated,
  resetAfterMs,
  setInactive,
  buildParams,
}: SocialActionConfig): { handleClick: () => void } {
  const popupRef = useRef<Window | null>(null);
  const tokenRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Held in refs so activate stays stable without requiring callers to memoize
  const onActivatedRef = useRef(onActivated);
  const setInactiveRef = useRef(setInactive);
  onActivatedRef.current = onActivated;
  setInactiveRef.current = setInactive;

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollAttemptsRef.current = 0;
  }, []);

  const activate = useCallback(() => {
    stopPolling();
    onActivatedRef.current();
    popupRef.current = null;
    tokenRef.current = null;
    if (resetAfterMs !== undefined) {
      resetTimerRef.current = setTimeout(
        () => setInactiveRef.current?.(),
        resetAfterMs,
      );
    }
  }, [stopPolling, resetAfterMs]);

  const startPolling = useCallback(() => {
    if (!tokenRef.current) return;
    const token = tokenRef.current;
    pollAttemptsRef.current = 0;

    pollRef.current = setInterval(async () => {
      pollAttemptsRef.current += 1;
      if (pollAttemptsRef.current > POLL_MAX_ATTEMPTS) {
        stopPolling();
        return;
      }
      try {
        const res = await fetch(`${serviceUrl}/status/${token}`);
        if (!res.ok) return;
        const data = (await res.json()) as { ok?: boolean; action?: string };
        if (data?.ok && data?.action === action) {
          activate();
        }
      } catch {
        // network blip, try again next tick
      }
    }, POLL_INTERVAL_MS);
  }, [action, serviceUrl, stopPolling, activate]);

  useEffect(() => {
    const allowedOrigin = new URL(serviceUrl).origin;

    function handleMessage(e: MessageEvent) {
      if (e.origin !== allowedOrigin) return;
      const data = e.data as { ok?: boolean; action?: string };
      if (data?.ok && data?.action === action) {
        activate();
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [action, serviceUrl, activate]);

  useEffect(() => {
    const id = setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        popupRef.current = null;
        if (!isActive) startPolling();
      }
    }, 500);
    return () => clearInterval(id);
  }, [isActive, startPolling]);

  useEffect(
    () => () => {
      stopPolling();
      if (resetTimerRef.current !== null) clearTimeout(resetTimerRef.current);
    },
    [stopPolling],
  );

  function handleClick() {
    if (isActive) return;
    stopPolling();
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    const token = crypto.randomUUID();
    tokenRef.current = token;
    popupRef.current = window.open(
      `${serviceUrl}${endpoint}?${buildParams(token)}`,
      "scribe-social",
      "width=480,height=640,resizable=yes",
    );
  }

  return { handleClick };
}

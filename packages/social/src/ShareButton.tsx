import { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_SERVICE_URL = "https://social.scribe-atp.app";
const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 20;
const SUCCESS_RESET_MS = 3000;

export interface ShareButtonProps {
  documentUri: string;
  publicationUri: string;
  title: string;
  canonicalUrl?: string;
  serviceUrl?: string;
}

export function ShareButton({
  documentUri,
  publicationUri,
  title,
  canonicalUrl,
  serviceUrl = DEFAULT_SERVICE_URL,
}: ShareButtonProps) {
  const [shared, setShared] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const tokenRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollAttemptsRef.current = 0;
  }, []);

  const handleSuccess = useCallback(() => {
    stopPolling();
    setShared(true);
    popupRef.current = null;
    tokenRef.current = null;
    // Reset after a short delay so the user can share again if desired
    resetTimerRef.current = setTimeout(() => setShared(false), SUCCESS_RESET_MS);
  }, [stopPolling]);

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
        if (data?.ok && data?.action === "share") {
          handleSuccess();
        }
      } catch {
        // network blip, try again next tick
      }
    }, POLL_INTERVAL_MS);
  }, [serviceUrl, stopPolling, handleSuccess]);

  useEffect(() => {
    const allowedOrigin = new URL(serviceUrl).origin;

    function handleMessage(e: MessageEvent) {
      if (e.origin !== allowedOrigin) return;
      const data = e.data as { ok?: boolean; action?: string };
      if (data?.ok && data?.action === "share") {
        handleSuccess();
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [serviceUrl, handleSuccess]);

  // When popup closes, start polling as postMessage fallback
  useEffect(() => {
    const id = setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        popupRef.current = null;
        if (!shared) startPolling();
      }
    }, 500);
    return () => clearInterval(id);
  }, [shared, startPolling]);

  useEffect(
    () => () => {
      stopPolling();
      if (resetTimerRef.current !== null) clearTimeout(resetTimerRef.current);
    },
    [stopPolling],
  );

  function handleClick() {
    if (shared) return;
    stopPolling();
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    const token = crypto.randomUUID();
    tokenRef.current = token;
    const resolvedCanonicalUrl = canonicalUrl ?? window.location.href;
    const params = new URLSearchParams({
      document: documentUri,
      publication: publicationUri,
      canonicalUrl: resolvedCanonicalUrl,
      origin: window.location.origin,
      title,
      token,
    });
    popupRef.current = window.open(
      `${serviceUrl}/share?${params}`,
      "scribe-social",
      "width=480,height=640,resizable=yes",
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={shared}
      aria-label={shared ? "Shared" : "Share this article"}
    >
      {shared ? "Shared ✓" : "Share"}
    </button>
  );
}

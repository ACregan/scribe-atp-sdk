import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { isRecommended, markRecommended } from "./storage.js";

const DEFAULT_SERVICE_URL = "https://social.scribe-atp.app";
const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 20; // 30 seconds

export interface LikeButtonProps {
  documentUri: string;
  publicationUri: string;
  title: string;
  serviceUrl?: string;
  className?: string;
  children?: ReactNode | ((isLiked: boolean) => ReactNode);
  onSuccess?: () => void;
  defaultLiked?: boolean;
}

export function LikeButton({
  documentUri,
  publicationUri,
  title,
  serviceUrl = DEFAULT_SERVICE_URL,
  className,
  children,
  onSuccess,
  defaultLiked,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(defaultLiked ?? false);
  const popupRef = useRef<Window | null>(null);
  const tokenRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);

  useEffect(() => {
    if (defaultLiked === undefined) {
      setLiked(isRecommended(documentUri));
    }
  }, [documentUri, defaultLiked]);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollAttemptsRef.current = 0;
  }, []);

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
        if (data?.ok && data?.action === "recommend") {
          stopPolling();
          markRecommended(documentUri);
          setLiked(true);
          onSuccess?.();
          popupRef.current = null;
          tokenRef.current = null;
        }
      } catch {
        // network blip, try again next tick
      }
    }, POLL_INTERVAL_MS);
  }, [documentUri, serviceUrl, stopPolling, onSuccess]);

  useEffect(() => {
    const allowedOrigin = new URL(serviceUrl).origin;

    function handleMessage(e: MessageEvent) {
      if (e.origin !== allowedOrigin) return;
      const data = e.data as { ok?: boolean; action?: string };
      if (data?.ok && data?.action === "recommend") {
        stopPolling();
        markRecommended(documentUri);
        setLiked(true);
        onSuccess?.();
        popupRef.current = null;
        tokenRef.current = null;
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [documentUri, serviceUrl, stopPolling, onSuccess]);

  // When popup closes, start polling as postMessage fallback
  useEffect(() => {
    const id = setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        popupRef.current = null;
        if (!liked) startPolling();
      }
    }, 500);
    return () => clearInterval(id);
  }, [liked, startPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  function handleClick() {
    if (liked) return;
    stopPolling();
    const token = crypto.randomUUID();
    tokenRef.current = token;
    const params = new URLSearchParams({
      document: documentUri,
      publication: publicationUri,
      origin: window.location.origin,
      title,
      token,
    });
    popupRef.current = window.open(
      `${serviceUrl}/recommend?${params}`,
      "scribe-social",
      "width=480,height=640,resizable=yes",
    );
  }

  const label =
    typeof children === "function"
      ? children(liked)
      : (children ?? (liked ? "Liked ✓" : "Like"));

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={liked}
      aria-label="Like this article"
      className={`scribe-atp-like-button${className ? ` ${className}` : ""}`}
    >
      {label}
    </button>
  );
}

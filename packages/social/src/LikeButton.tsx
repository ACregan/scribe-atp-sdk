import { useState, useEffect, useRef } from "react";
import { isRecommended, markRecommended } from "./storage.js";

const DEFAULT_SERVICE_URL = "https://social.scribe-atp.app";

export interface LikeButtonProps {
  documentUri: string;
  title: string;
  serviceUrl?: string;
}

export function LikeButton({
  documentUri,
  title,
  serviceUrl = DEFAULT_SERVICE_URL,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    setLiked(isRecommended(documentUri));
  }, [documentUri]);

  useEffect(() => {
    const allowedOrigin = new URL(serviceUrl).origin;

    function handleMessage(e: MessageEvent) {
      if (e.origin !== allowedOrigin) return;
      const data = e.data as { ok?: boolean; action?: string };
      if (data?.ok && data?.action === "recommend") {
        markRecommended(documentUri);
        setLiked(true);
        popupRef.current = null;
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [documentUri, serviceUrl]);

  function handleClick() {
    if (liked) return;
    const params = new URLSearchParams({
      document: documentUri,
      origin: window.location.origin,
      title,
    });
    popupRef.current = window.open(
      `${serviceUrl}/recommend?${params}`,
      "scribe-social",
      "width=480,height=640,resizable=yes"
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={liked}
      aria-label={liked ? "Liked" : "Like this article"}
    >
      {liked ? "Liked ✓" : "Like"}
    </button>
  );
}

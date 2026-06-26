import { useState, useEffect, useRef } from "react";
import { isSubscribed, markSubscribed } from "./storage.js";

const DEFAULT_SERVICE_URL = "https://social.scribe-atp.app";

export interface SubscribeButtonProps {
  publicationUri: string;
  title: string;
  serviceUrl?: string;
}

export function SubscribeButton({
  publicationUri,
  title,
  serviceUrl = DEFAULT_SERVICE_URL,
}: SubscribeButtonProps) {
  const [subscribed, setSubscribed] = useState(false);
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    setSubscribed(isSubscribed(publicationUri));
  }, [publicationUri]);

  useEffect(() => {
    const allowedOrigin = new URL(serviceUrl).origin;

    function handleMessage(e: MessageEvent) {
      if (e.origin !== allowedOrigin) return;
      const data = e.data as { ok?: boolean; action?: string };
      if (data?.ok && data?.action === "subscribe") {
        markSubscribed(publicationUri);
        setSubscribed(true);
        popupRef.current = null;
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [publicationUri, serviceUrl]);

  function handleClick() {
    if (subscribed) return;
    const params = new URLSearchParams({
      publication: publicationUri,
      origin: window.location.origin,
      title,
    });
    popupRef.current = window.open(
      `${serviceUrl}/subscribe?${params}`,
      "scribe-social",
      "width=480,height=640,resizable=yes"
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={subscribed}
      aria-label={subscribed ? "Subscribed" : "Subscribe"}
    >
      {subscribed ? "Subscribed ✓" : "Subscribe"}
    </button>
  );
}

import { useState, useEffect, type ReactNode } from "react";
import { isSubscribed, markSubscribed } from "./storage.js";
import { useSocialAction } from "./useSocialAction.js";

const DEFAULT_SERVICE_URL = "https://social.scribe-atp.app";

export interface SubscribeButtonProps {
  publicationUri: string;
  title: string;
  serviceUrl?: string;
  className?: string;
  children?: ReactNode | ((isSubscribed: boolean) => ReactNode);
  onSuccess?: () => void;
  defaultSubscribed?: boolean;
}

export function SubscribeButton({
  publicationUri,
  title,
  serviceUrl = DEFAULT_SERVICE_URL,
  className,
  children,
  onSuccess,
  defaultSubscribed,
}: SubscribeButtonProps) {
  const [subscribed, setSubscribed] = useState(defaultSubscribed ?? false);

  useEffect(() => {
    if (defaultSubscribed === undefined) setSubscribed(isSubscribed(publicationUri));
  }, [publicationUri, defaultSubscribed]);

  const { handleClick } = useSocialAction({
    isActive: subscribed,
    action: "subscribe",
    endpoint: "/subscribe",
    serviceUrl,
    onActivated: () => {
      markSubscribed(publicationUri);
      setSubscribed(true);
      onSuccess?.();
    },
    buildParams: (token) =>
      new URLSearchParams({
        publication: publicationUri,
        origin: window.location.origin,
        title,
        token,
      }),
  });

  const label =
    typeof children === "function"
      ? children(subscribed)
      : (children ?? (subscribed ? "Subscribed ✓" : "Subscribe"));

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={subscribed}
      aria-label="Subscribe"
      className={`scribe-atp-subscribe-button${className ? ` ${className}` : ""}`}
    >
      {label}
    </button>
  );
}

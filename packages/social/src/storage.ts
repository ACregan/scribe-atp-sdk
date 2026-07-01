function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable (SSR, private browsing quota, etc.)
  }
}

export function isRecommended(documentUri: string): boolean {
  return safeGet(`scribe:recommended:${documentUri}`) === "1";
}

export function markRecommended(documentUri: string) {
  safeSet(`scribe:recommended:${documentUri}`, "1");
}

export function isSubscribed(publicationUri: string): boolean {
  return safeGet(`scribe:subscribed:${publicationUri}`) === "1";
}

export function markSubscribed(publicationUri: string) {
  safeSet(`scribe:subscribed:${publicationUri}`, "1");
}

export function clearSubscribed(publicationUri: string) {
  try {
    localStorage.removeItem(`scribe:subscribed:${publicationUri}`);
  } catch {
    // localStorage unavailable
  }
}

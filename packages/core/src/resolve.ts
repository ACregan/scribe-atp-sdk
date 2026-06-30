const handleCache = new Map<string, string>();
const pdsCache = new Map<string, string>();

export function _clearCaches(): void {
  handleCache.clear();
  pdsCache.clear();
}

export async function resolveIdentifier(
  handleOrDid: string,
  signal?: AbortSignal
): Promise<string> {
  if (handleOrDid.startsWith("did:")) return handleOrDid;
  const cached = handleCache.get(handleOrDid);
  if (cached) return cached;

  const url = `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handleOrDid)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to resolve handle: ${res.statusText}`);
  const data = (await res.json()) as { did: string };
  handleCache.set(handleOrDid, data.did);
  return data.did;
}

export async function resolvePds(
  did: string,
  signal?: AbortSignal
): Promise<string> {
  const cached = pdsCache.get(did);
  if (cached) return cached;

  let didDocUrl: string;
  if (did.startsWith("did:plc:")) {
    didDocUrl = `https://plc.directory/${encodeURIComponent(did)}`;
  } else if (did.startsWith("did:web:")) {
    const domain = did.slice("did:web:".length);
    didDocUrl = `https://${domain}/.well-known/did.json`;
  } else {
    throw new Error(`Unsupported DID method: ${did}`);
  }

  const res = await fetch(didDocUrl, { signal });
  if (!res.ok) throw new Error(`Failed to fetch DID document: ${res.statusText}`);

  const doc = (await res.json()) as {
    service?: Array<{ id: string; serviceEndpoint: string }>;
  };

  const pdsService = doc.service?.find((s) => s.id === "#atproto_pds");
  if (!pdsService) throw new Error(`No PDS service found in DID document for ${did}`);

  pdsCache.set(did, pdsService.serviceEndpoint);
  return pdsService.serviceEndpoint;
}

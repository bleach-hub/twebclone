/**
 * Resolve the visitor's ISO-3166 alpha-2 country code.
 *
 * Primary path: `/api/geo` served by the Vite plugin in vite.config.ts using
 * a local DB-IP Country Lite .mmdb (no external request at runtime).
 *
 * Dev fallback: when the request comes from localhost the local DB has
 * nothing useful to say (the server responds 204). We then try a couple of
 * free public APIs as a development convenience so the country picker still
 * preselects something sensible in `npm run dev` on the loopback.
 */

type Provider = {
  url: string;
  pick: (json: any) => string | undefined;
};

const FALLBACKS: Provider[] = [
  {url: 'https://api.country.is/', pick: (j) => j?.country},
  {url: 'https://ipwho.is/', pick: (j) => (j?.success !== false ? j?.country_code : undefined)}
];

function valid(iso2: string | undefined): string | undefined {
  return iso2 && /^[A-Z]{2}$/.test(iso2.toUpperCase()) ? iso2.toUpperCase() : undefined;
}

export async function detectCountryIso2(signal?: AbortSignal): Promise<string | undefined> {
  // 1) Local Vite middleware (production-style path).
  try {
    const res = await fetch('/api/geo', {signal});
    if(res.ok) {
      const json = await res.json();
      const hit = valid(json?.country);
      if(hit) return hit;
    }
    // 204 = loopback in dev; fall through to public APIs.
  } catch {
    // network error → fall through
  }

  // 2) Dev-only fallback to keyless public APIs.
  for(const p of FALLBACKS) {
    try {
      const res = await fetch(p.url, {signal});
      if(!res.ok) continue;
      const json = await res.json();
      const hit = valid(p.pick(json));
      if(hit) return hit;
    } catch {
      // try next
    }
  }
  return undefined;
}

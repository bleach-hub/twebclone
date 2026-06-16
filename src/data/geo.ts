/**
 * Resolve the visitor's ISO-3166 alpha-2 country code from their public IP.
 * Mirrors tweb's `help.getNearestDc` (which returns a `country` field) — we
 * don't have MTProto here, so we ask a free, keyless IP geolocation API and
 * fall back through a couple more if the first fails.
 *
 * All three endpoints are HTTPS, CORS-enabled, and require no API key.
 */

type Provider = {
  url: string;
  pick: (json: any) => string | undefined;
};

const PROVIDERS: Provider[] = [
  {url: 'https://api.country.is/', pick: (j) => j?.country},
  {url: 'https://ipwho.is/', pick: (j) => (j?.success !== false ? j?.country_code : undefined)},
  {url: 'https://ipapi.co/json/', pick: (j) => j?.country_code}
];

export async function detectCountryIso2(signal?: AbortSignal): Promise<string | undefined> {
  for(const p of PROVIDERS) {
    try {
      const res = await fetch(p.url, {signal});
      if(!res.ok) continue;
      const json = await res.json();
      const iso2 = p.pick(json);
      if(iso2 && /^[A-Z]{2}$/.test(iso2.toUpperCase())) return iso2.toUpperCase();
    } catch {
      // try next provider
    }
  }
  return undefined;
}

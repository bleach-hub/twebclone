import {defineConfig, Plugin} from 'vite';
import solid from 'vite-plugin-solid';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {open, CountryResponse, Reader} from 'maxmind';

/**
 * Server-side GeoIP lookup. Replaces the public-API fallback chain.
 * Reads data/geoip-country.mmdb (DB-IP Country Lite, downloaded by
 * scripts/download-geoip.mjs) and resolves the client's ISO-3166 alpha-2.
 *
 * Loopback IPs (dev) have no useful answer, so the middleware bails out and
 * the client retains its existing graceful-no-op behavior.
 */
function geoipMiddleware(): Plugin {
  let reader: Reader<CountryResponse> | null | undefined;
  let loadPromise: Promise<void> | undefined;
  const dbPath = resolve(__dirname, 'data', 'geoip-country.mmdb');

  async function ensureReader() {
    if(reader !== undefined) return;
    if(loadPromise) return loadPromise;
    loadPromise = (async() => {
      if(!existsSync(dbPath)) {
        console.warn(`[geoip] ${dbPath} not found — run \`node scripts/download-geoip.mjs\``);
        reader = null;
        return;
      }
      reader = await open<CountryResponse>(dbPath);
      console.log(`[geoip] loaded ${dbPath}`);
    })();
    return loadPromise;
  }

  function clientIp(req: any): string | undefined {
    const fwd = req.headers['x-forwarded-for'];
    if(typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
    const remote = req.socket?.remoteAddress as string | undefined;
    if(!remote) return undefined;
    return remote.startsWith('::ffff:') ? remote.slice(7) : remote;
  }

  function isLoopback(ip: string | undefined): boolean {
    if(!ip) return true;
    return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('127.') || ip === '::ffff:127.0.0.1';
  }

  return {
    name: 'geoip-middleware',
    configureServer(server) {
      server.middlewares.use('/api/geo', async(req, res) => {
        res.setHeader('content-type', 'application/json');
        try {
          await ensureReader();
          const ip = clientIp(req);
          if(isLoopback(ip)) {
            res.statusCode = 204;
            res.end();
            return;
          }
          if(!reader) {
            res.statusCode = 503;
            res.end(JSON.stringify({error: 'geoip database missing'}));
            return;
          }
          const hit = reader.get(ip!);
          const iso2 = hit?.country?.iso_code;
          res.end(JSON.stringify({ip, country: iso2 ?? null}));
        } catch(err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({error: String(err?.message ?? err)}));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [solid(), geoipMiddleware()],
  server: {
    port: 5173,
    open: true
  }
});

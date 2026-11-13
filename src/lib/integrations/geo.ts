import { serverEnv } from "../env";
import { cacheGetJson, cacheSetJson, upstashConfigured } from "./upstash";

/**
 * IP geolocation for security auditing.
 *
 * IPstack was rejected: its free plan is HTTP-only (HTTPS is a paid add-on)
 * and capped at 100 requests/month, so using it would mean either paying or
 * sending audit traffic in clear text.
 *
 * Instead we use free, keyless, HTTPS providers in a failover chain:
 *   1. api.country.is  - no key, no documented quota (country only)
 *   2. ipapi.co        - no key, ~1000 requests/day (country/region/city)
 *   3. ipwho.is        - no key, 10k requests/month (country/region/city)
 * All three are called server-side only and every failure degrades to null,
 * so auditing never blocks a request.
 */

export type GeoProvider = "api.country.is" | "ipapi.co" | "ipwho.is";

export interface GeoInfo {
  country: string;
  region: string;
  city: string;
  provider: GeoProvider;
}

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f:]{3,45}$/i;

export function normalizeIp(raw: string | null | undefined): string {
  if (!raw) return "";
  const first = raw.split(",")[0]?.trim() ?? "";
  const withoutPort = first.replace(/^\[(.+)\](?::\d+)?$/, "$1").replace(/:\d+$/, "");
  if (!IPV4.test(withoutPort) && !IPV6.test(withoutPort)) return "";
  return withoutPort;
}

export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
    return true;
  }
  if (!IPV4.test(ip)) return false;
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

const memoryCache = new Map<string, { value: GeoInfo | null; expiresAt: number }>();

function str(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

interface GeoResolver {
  provider: GeoProvider;
  url: (ip: string) => string;
  map: (data: Record<string, unknown>) => GeoInfo | null;
}

/** Ordered failover chain. Country-only providers come first (larger quotas). */
const RESOLVERS: GeoResolver[] = [
  {
    provider: "api.country.is",
    url: (ip) => `https://api.country.is/${encodeURIComponent(ip)}`,
    map: (data) => {
      const country = str(data.country);
      return country ? { country, region: "", city: "", provider: "api.country.is" } : null;
    },
  },
  {
    provider: "ipapi.co",
    url: (ip) => `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
    map: (data) => {
      if (data.error) return null;
      const country = str(data.country_code) || str(data.country_name);
      return country
        ? {
            country,
            region: str(data.region_code) || str(data.region),
            city: str(data.city),
            provider: "ipapi.co",
          }
        : null;
    },
  },
  {
    provider: "ipwho.is",
    url: (ip) => `https://ipwho.is/${encodeURIComponent(ip)}`,
    map: (data) => {
      if (data.success === false) return null;
      const country = str(data.country_code) || str(data.country);
      return country
        ? {
            country,
            region: str(data.region),
            city: str(data.city),
            provider: "ipwho.is",
          }
        : null;
    },
  },
];

export async function lookupIp(ip: string): Promise<GeoInfo | null> {
  if (!serverEnv.geoLookupEnabled || !ip || isPrivateIp(ip)) return null;

  const cached = memoryCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  if (upstashConfigured()) {
    const shared = await cacheGetJson<GeoInfo>(`geo:${ip}`);
    if (shared) {
      memoryCache.set(ip, { value: shared, expiresAt: Date.now() + 60_000 });
      return shared;
    }
  }

  let result: GeoInfo | null = null;
  for (const resolver of RESOLVERS) {
    try {
      const response = await fetch(resolver.url(ip), {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      });
      if (!response.ok) continue;
      const data = (await response.json()) as Record<string, unknown> | null;
      if (!data) continue;
      const mapped = resolver.map(data);
      if (mapped && mapped.country) {
        result = mapped;
        break;
      }
    } catch {
      // Try the next provider; geolocation is best-effort only.
    }
  }

  memoryCache.set(ip, { value: result, expiresAt: Date.now() + 60 * 60 * 1000 });
  if (result && upstashConfigured()) {
    await cacheSetJson(`geo:${ip}`, result, 60 * 60 * 24);
  }
  return result;
}

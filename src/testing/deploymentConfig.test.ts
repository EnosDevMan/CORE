import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface HeaderEntry { key: string; value: string }
interface HeaderRule { source: string; headers: HeaderEntry[] }

const config = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8')) as { headers: HeaderRule[] };
const globalHeaders = new Map(config.headers.find(rule => rule.source === '/(.*)')?.headers.map(header => [header.key, header.value]));

describe('production deployment headers', () => {
  it.each([
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', 'DENY'],
    ['Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload'],
    ['Cross-Origin-Opener-Policy', 'same-origin'],
    ['Cross-Origin-Resource-Policy', 'same-origin'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ])('keeps %s hardened', (header, expected) => {
    expect(globalHeaders.get(header)).toBe(expected);
  });

  it('keeps a restrictive CSP for code, connections, frames and forms', () => {
    const csp = globalHeaders.get('Content-Security-Policy') ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("object-src 'none'");
  });

  it('caches only fingerprinted Vite assets as immutable', () => {
    const assetRule = config.headers.find(rule => rule.source === '/assets/(.*)');
    expect(assetRule?.headers).toContainEqual({
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    });
  });
});

import type { BusinessProfile } from './types';

const FALLBACK_DESCRIPTION = 'Consulte serviços, profissionais e horários disponíveis.';

function upsertMeta(document: Document, selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

/** Applies installation data to browser metadata without embedding a customer in the build. */
export function applyBusinessMetadata(
  document: Document,
  location: Pick<Location, 'origin' | 'pathname'>,
  profile: BusinessProfile,
  themeColor: string,
) {
  const title = `${profile.name} — Agendamento online`;
  const description = profile.description?.trim() || FALLBACK_DESCRIPTION;
  const canonicalUrl = new URL(location.pathname || '/', location.origin).toString();
  document.title = title;

  upsertMeta(document, 'meta[name="description"]', 'name', 'description', description);
  upsertMeta(document, 'meta[name="theme-color"]', 'name', 'theme-color', themeColor);
  upsertMeta(document, 'meta[property="og:title"]', 'property', 'og:title', title);
  upsertMeta(document, 'meta[property="og:description"]', 'property', 'og:description', description);
  upsertMeta(document, 'meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
  upsertMeta(document, 'meta[name="twitter:title"]', 'name', 'twitter:title', title);
  upsertMeta(document, 'meta[name="twitter:description"]', 'name', 'twitter:description', description);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.append(canonical);
  }
  canonical.href = canonicalUrl;
}

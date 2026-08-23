import { describe, expect, it } from 'vitest';
import { applyBusinessMetadata } from './metadata';
import type { BusinessProfile } from './types';

const profile: BusinessProfile = {
  name: 'Studio Demo', description: 'Atendimento personalizado.',
  timezone: 'America/Sao_Paulo', currency: 'BRL', locale: 'pt-BR',
  nicheId: 'beauty_salon', themeId: 'minimal_light',
};

describe('applyBusinessMetadata', () => {
  it('publishes the active installation instead of build-time customer data', () => {
    document.head.innerHTML = '<meta name="description"><link rel="canonical">';
    applyBusinessMetadata(document, { origin: 'https://studio.example', pathname: '/' }, profile, '#ffffff');

    expect(document.title).toBe('Studio Demo — Agendamento online');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Atendimento personalizado.');
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(document.title);
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#ffffff');
    expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe('https://studio.example/');
  });

  it('uses neutral copy when the business has no description', () => {
    applyBusinessMetadata(document, { origin: 'https://pet.example', pathname: '/agendar' }, { ...profile, description: undefined }, '#111827');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('serviços');
    expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe('https://pet.example/agendar');
  });
});

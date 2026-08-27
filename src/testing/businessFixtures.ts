import type { BusinessProfile, Capability } from '../core/business/types';

export interface BusinessFixture {
  profile: BusinessProfile;
  capabilities: readonly Capability[];
  services: readonly string[];
  professionals: readonly string[];
  hours: { open: string; close: string };
}

export const BUSINESS_FIXTURES: readonly BusinessFixture[] = [
  { profile: { name: 'Barbearia Demo', nicheId: 'barbershop', themeId: 'premium_dark', themeStyleId: 'premium', paletteId: 'graphite', timezone: 'America/Sao_Paulo', currency: 'BRL', locale: 'pt-BR' }, capabilities: ['online_booking','customers','professionals','services','loyalty'], services: ['Corte','Barba'], professionals: ['Rafael'], hours: { open:'09:00', close:'19:00' } },
  { profile: { name: 'Salão Demo', nicheId: 'beauty_salon', themeId: 'rose_elegance', themeStyleId: 'editorial', paletteId: 'rose', timezone: 'America/Sao_Paulo', currency: 'BRL', locale: 'pt-BR' }, capabilities: ['online_booking','customers','professionals','services'], services: ['Escova','Coloração'], professionals: ['Camila'], hours: { open:'08:00', close:'18:00' } },
  { profile: { name: 'Nail Studio Demo', nicheId: 'nail_studio', themeId: 'lavender_studio', themeStyleId: 'showcase', paletteId: 'lavender', timezone: 'America/Sao_Paulo', currency: 'BRL', locale: 'pt-BR' }, capabilities: ['online_booking','customers','professionals','services','loyalty'], services: ['Alongamento','Nail Art'], professionals: ['Lívia'], hours: { open:'10:00', close:'20:00' } },
  { profile: { name: 'Pet Shop Demo', nicheId: 'pet_shop', themeId: 'forest_clean', themeStyleId: 'clean', paletteId: 'forest', timezone: 'America/Sao_Paulo', currency: 'BRL', locale: 'pt-BR' }, capabilities: ['online_booking','customers','professionals','services','pets'], services: ['Banho','Tosa'], professionals: ['Marcos'], hours: { open:'08:00', close:'17:00' } },
];

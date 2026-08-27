import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { THEME_STYLE_REGISTRY } from '../layouts/registry';
import { NICHE_REGISTRY } from '../niches/registry';
import { PALETTE_REGISTRY } from './paletteRegistry';
import { THEME_REGISTRY } from './registry';

const schema = readFileSync(resolve(process.cwd(), 'supabase/schema.sql'), 'utf8');

function getBusinessProfileThemeConstraint(sql: string): string {
  const match = sql.match(/theme_id\s+text\s+not\s+null[\s\S]*?check\s*\(theme_id\s+in\s*\(([\s\S]*?)\)\)/i);
  if (!match) throw new Error('Constraint de theme_id não encontrada no schema consolidado.');
  return match[1];
}

function getTextConstraint(sql: string, column: string): string {
  const match = sql.match(new RegExp(`${column}\\s+text\\s+not\\s+null[\\s\\S]*?check\\s*\\(${column}\\s+in\\s*\\(([\\s\\S]*?)\\)\\)`, 'i'));
  if (!match) throw new Error(`Constraint de ${column} não encontrada no schema consolidado.`);
  return match[1];
}

describe('database appearance contract', () => {
  it('keeps every frontend theme accepted by the consolidated schema', () => {
    const constraint = getBusinessProfileThemeConstraint(schema);
    const ids = Object.keys(THEME_REGISTRY);

    expect(ids).toHaveLength(12);
    for (const id of ids) expect(constraint).toContain(`'${id}'`);
  });

  it('accepts all registered style and palette IDs without removing theme_id', () => {
    const styleConstraint = getTextConstraint(schema, 'theme_style_id');
    const paletteConstraint = getTextConstraint(schema, 'palette_id');
    for (const id of Object.keys(THEME_STYLE_REGISTRY)) expect(styleConstraint).toContain(`'${id}'`);
    for (const id of Object.keys(PALETTE_REGISTRY)) expect(paletteConstraint).toContain(`'${id}'`);
    expect(schema).toContain('business_profile_appearance_niche_check');
  });

  it('keeps the frontend niche matrix mirrored in the database contract', () => {
    for (const niche of Object.values(NICHE_REGISTRY)) {
      expect(schema).toContain(`when '${niche.id}'`);
      for (const styleId of niche.availableStyleIds) expect(schema).toContain(`'${styleId}'`);
      for (const paletteId of niche.availablePaletteIds) expect(schema).toContain(`'${paletteId}'`);
    }
  });

  it('retains the old onboarding RPC and adds the appearance overload', () => {
    expect(schema).toContain('p_theme_style_id text');
    expect(schema).toContain('p_palette_id text');
    expect(schema).toContain('business_profile_sync_legacy_appearance');
    expect(schema).toContain('Legacy compatibility');
  });

  it('never clears the whole feature_settings table during onboarding', () => {
    expect(schema.toLowerCase()).not.toContain('delete from public.feature_settings;');
    expect(schema.toLowerCase()).toContain('update public.feature_settings');
    expect(schema.toLowerCase()).toContain('where enabled = true');
  });
});

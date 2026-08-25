import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { THEME_REGISTRY } from './registry';

const schema = readFileSync(resolve(process.cwd(), 'supabase/schema.sql'), 'utf8');

function getBusinessProfileThemeConstraint(sql: string): string {
  const match = sql.match(/theme_id\s+text\s+not\s+null[\s\S]*?check\s*\(theme_id\s+in\s*\(([\s\S]*?)\)\)/i);
  if (!match) throw new Error('Constraint de theme_id não encontrada no schema consolidado.');
  return match[1];
}

describe('database appearance contract', () => {
  it('keeps every frontend theme accepted by the consolidated schema', () => {
    const constraint = getBusinessProfileThemeConstraint(schema);
    const ids = Object.keys(THEME_REGISTRY);

    expect(ids).toHaveLength(12);
    for (const id of ids) expect(constraint).toContain(`'${id}'`);
  });

  it('never clears the whole feature_settings table during onboarding', () => {
    expect(schema.toLowerCase()).not.toContain('delete from public.feature_settings;');
    expect(schema.toLowerCase()).toContain('update public.feature_settings');
    expect(schema.toLowerCase()).toContain('where enabled = true');
  });
});

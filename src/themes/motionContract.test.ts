import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const globalCss = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
const performanceCss = readFileSync(resolve(process.cwd(), 'src/performance.css'), 'utf8');

describe('appearance motion contract', () => {
  it('keeps a global reduced-motion fallback independent from style and palette', () => {
    expect(globalCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(globalCss).toMatch(/animation-duration:\s*\.01ms\s*!important/);
    expect(globalCss).toMatch(/transition-duration:\s*\.01ms\s*!important/);
  });

  it('disables route animations and transforms for reduced motion', () => {
    expect(performanceCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(performanceCss).toMatch(/\.core-view-enter[\s\S]*?animation:\s*none\s*!important/);
    expect(performanceCss).toMatch(/\.core-view-enter[\s\S]*?transform:\s*none\s*!important/);
  });
});

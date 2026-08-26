import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const distDirectory = new URL('../dist/assets/', import.meta.url);
const limits = {
  largestJavaScript: Number(process.env.BUNDLE_MAX_JS_KB ?? 230) * 1024,
  // Recent universal UX work added owner-managed media, adaptive booking and
  // richer administration. Keep a small aggregate allowance for those
  // product features while preserving the strict per-chunk ceiling.
  totalJavaScript: Number(process.env.BUNDLE_TOTAL_JS_KB ?? 748) * 1024,
  totalCss: Number(process.env.BUNDLE_TOTAL_CSS_KB ?? 109) * 1024,
};

const files = await readdir(distDirectory);
const assets = await Promise.all(files.map(async name => ({
  name,
  bytes: (await stat(join(distDirectory.pathname, name))).size,
})));
const javascript = assets.filter(asset => asset.name.endsWith('.js'));
const css = assets.filter(asset => asset.name.endsWith('.css'));
const largestJavaScript = javascript.reduce((largest, asset) => asset.bytes > largest.bytes ? asset : largest, { name: 'none', bytes: 0 });
const totalJavaScript = javascript.reduce((total, asset) => total + asset.bytes, 0);
const totalCss = css.reduce((total, asset) => total + asset.bytes, 0);
const kb = bytes => `${(bytes / 1024).toFixed(1)} kB`;

const violations = [
  largestJavaScript.bytes > limits.largestJavaScript && `Maior chunk JS (${largestJavaScript.name}): ${kb(largestJavaScript.bytes)} > ${kb(limits.largestJavaScript)}`,
  totalJavaScript > limits.totalJavaScript && `JavaScript total: ${kb(totalJavaScript)} > ${kb(limits.totalJavaScript)}`,
  totalCss > limits.totalCss && `CSS total: ${kb(totalCss)} > ${kb(limits.totalCss)}`,
].filter(Boolean);

if (violations.length) {
  console.error(`Bundle excedeu o orçamento de produção:\n- ${violations.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Bundle dentro do orçamento: maior JS ${kb(largestJavaScript.bytes)}, JS total ${kb(totalJavaScript)}, CSS total ${kb(totalCss)}.`);
}

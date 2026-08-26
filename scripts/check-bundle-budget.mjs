import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const distDirectory = new URL('../dist/assets/', import.meta.url);
const limits = {
  largestJavaScript: Number(process.env.BUNDLE_MAX_JS_KB ?? 230) * 1024,
  // Code splitting creates a few tiny loader/shared chunks and can increase the
  // aggregate byte count while materially reducing what a user downloads to
  // open a specific screen. Keep an aggregate ceiling, but also guard the
  // critical chunks directly so lazy loading cannot be "optimized" on paper.
  totalJavaScript: Number(process.env.BUNDLE_TOTAL_JS_KB ?? 790) * 1024,
  appShell: Number(process.env.BUNDLE_APP_JS_KB ?? 108) * 1024,
  adminShell: Number(process.env.BUNDLE_ADMIN_JS_KB ?? 35) * 1024,
  bookingFlow: Number(process.env.BUNDLE_BOOKING_JS_KB ?? 32) * 1024,
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
const findChunk = prefix => javascript.find(asset => asset.name.startsWith(`${prefix}-`)) ?? { name: `${prefix}-missing`, bytes: Number.POSITIVE_INFINITY };

const appShell = findChunk('App');
const adminShell = findChunk('AdminDashboard');
const bookingFlow = findChunk('BookingFlow');

const violations = [
  largestJavaScript.bytes > limits.largestJavaScript && `Maior chunk JS (${largestJavaScript.name}): ${kb(largestJavaScript.bytes)} > ${kb(limits.largestJavaScript)}`,
  totalJavaScript > limits.totalJavaScript && `JavaScript total: ${kb(totalJavaScript)} > ${kb(limits.totalJavaScript)}`,
  appShell.bytes > limits.appShell && `App shell (${appShell.name}): ${kb(appShell.bytes)} > ${kb(limits.appShell)}`,
  adminShell.bytes > limits.adminShell && `Admin inicial (${adminShell.name}): ${kb(adminShell.bytes)} > ${kb(limits.adminShell)}`,
  bookingFlow.bytes > limits.bookingFlow && `Fluxo de agendamento (${bookingFlow.name}): ${kb(bookingFlow.bytes)} > ${kb(limits.bookingFlow)}`,
  totalCss > limits.totalCss && `CSS total: ${kb(totalCss)} > ${kb(limits.totalCss)}`,
].filter(Boolean);

if (violations.length) {
  console.error(`Bundle excedeu o orçamento de produção:\n- ${violations.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(
    `Bundle dentro do orçamento: maior JS ${kb(largestJavaScript.bytes)}, total ${kb(totalJavaScript)}, `
    + `App ${kb(appShell.bytes)}, Admin ${kb(adminShell.bytes)}, Booking ${kb(bookingFlow.bytes)}, CSS ${kb(totalCss)}.`,
  );
}

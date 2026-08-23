const expand = (value: string) => value.length === 3 ? value.split('').map(char => char + char).join('') : value;

export function relativeLuminance(hex: string): number {
  const normalized = expand(hex.replace('#', ''));
  if (!/^[0-9a-f]{6}$/i.test(normalized)) throw new Error(`Cor hexadecimal inválida: ${hex}`);
  const channels = [0, 2, 4].map(index => parseInt(normalized.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

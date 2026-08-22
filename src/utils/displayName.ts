/** Keeps account names compact in navigation without changing the saved name. */
export const getCompactDisplayName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || '';
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
};

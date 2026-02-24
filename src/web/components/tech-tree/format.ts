/** Convert a hyphenated slug to title case: `"oil-processing"` → `"Oil Processing"` */
export function formatName(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

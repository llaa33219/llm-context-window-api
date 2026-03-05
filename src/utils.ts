export function normalizeModelName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createCacheKey(modelName: string): string {
  return `model:${normalizeModelName(modelName)}`;
}

export function findBestMatch(
  inputName: string,
  models: Array<{ name: string; slug: string }>
): { name: string; slug: string } | null {
  const normalized = normalizeModelName(inputName);
  
  const exactMatch = models.find(
    m => normalizeModelName(m.name) === normalized || m.slug === normalized
  );
  if (exactMatch) return exactMatch;

  const partialMatch = models.find(
    m => normalizeModelName(m.name).includes(normalized) || 
         m.slug.includes(normalized)
  );
  if (partialMatch) return partialMatch;

  const containsMatch = models.find(
    m => normalized.includes(normalizeModelName(m.name)) ||
         normalized.includes(m.slug)
  );
  
  return containsMatch || null;
}

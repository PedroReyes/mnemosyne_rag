export function extractPathUpToKeyword(path: string, keyword: string): string {
  const idx = path.indexOf(keyword);

  if (idx === -1) {
    throw new Error(`Keyword "${keyword}" not found in path "${path}"`);
  }

  return path.substring(0, idx + keyword.length);
}

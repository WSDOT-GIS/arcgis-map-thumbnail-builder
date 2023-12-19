/**
 * Gets the "webmap" (case-insensitive) parameter from the query string.
 * Returns null if there is no such parameter.
 * @param url - The URL to get the webmap ID from.
 * @returns the webmap ID, if provided, or null otherwise.
 */
export function getMapIdFromQueryString(url: string | URL = location.href) {
  const re = /^webmap$/i;
  if (typeof url === "string") {
    url = new URL(url);
  }
  for (const [key, value] of url.searchParams) {
    if (re.test(key)) {
      return value;
    }
  }
  return null;
}

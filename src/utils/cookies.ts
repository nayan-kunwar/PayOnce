export function getCookieValue(
  cookieHeader: string | undefined,
  cookieName: string,
): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");
  for (const rawCookie of cookies) {
    const [name, ...valueParts] = rawCookie.trim().split("=");
    if (name === cookieName) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

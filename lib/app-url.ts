export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getRequestBaseUrl(headersList: Headers): string {
  const forwardedProto = headersList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = headersList.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headersList.get("host");

  if (host) {
    const protocol = forwardedProto || (isLocalHost(host) ? "http" : "https");
    return normalizeBaseUrl(`${protocol}://${host}`);
  }

  return getConfiguredBaseUrl();
}

export function getConfiguredBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    "http://localhost:3000";

  return normalizeBaseUrl(configuredUrl);
}

function isLocalHost(host: string): boolean {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
}

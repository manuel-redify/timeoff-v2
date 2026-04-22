const DEFAULT_APP_URL = 'http://localhost:3000';

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getAppBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    DEFAULT_APP_URL;

  return normalizeBaseUrl(configuredUrl);
}

export function buildLeaveActionUrls(token: string) {
  const baseUrl = getAppBaseUrl();

  return {
    approveUrl: `${baseUrl}/actions/approve/${token}`,
    rejectUrl: `${baseUrl}/actions/reject/${token}`,
  };
}

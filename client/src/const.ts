export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// state encodes { origin, returnPath } so the OAuth callback can redirect correctly.
export const getLoginUrl = (returnPath = "/feed") => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  if (!oauthPortalUrl?.trim() || !appId?.trim()) {
    return `${window.location.origin}${returnPath.startsWith("/") ? returnPath : `/${returnPath}`}`;
  }
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(JSON.stringify({ origin: window.location.origin, returnPath }));

  const url = new URL("app-auth", oauthPortalUrl.endsWith("/") ? oauthPortalUrl : `${oauthPortalUrl}/`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  url.searchParams.set("appName", "Swipestakes");

  return url.toString();
};

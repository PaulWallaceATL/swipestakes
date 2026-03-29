export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Only allow same-origin paths (prevents open redirects). */
function safeReturnPath(returnPath: string): string {
  const p = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
  if (p.startsWith("//") || p.includes("://")) return "/feed";
  return p;
}

/** Email/password login page; `return` is where we send the user after success. */
export const getLoginUrl = (returnPath = "/feed") => {
  const path = safeReturnPath(returnPath);
  const q = new URLSearchParams({ return: path });
  return `${window.location.origin}/login?${q.toString()}`;
};

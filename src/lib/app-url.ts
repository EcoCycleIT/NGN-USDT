/**
 * Public site origin for auth email links (confirm signup, magic links, etc.).
 * Set NEXT_PUBLIC_APP_URL on Vercel to your deployment URL so Supabase emails
 * redirect to production, not localhost.
 */
export function getPublicSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

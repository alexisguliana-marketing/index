/**
 * Only allow same-site relative paths as a post-auth redirect target, to
 * avoid an open-redirect via a crafted `?redirect=` query value.
 */
export function safeRedirectTarget(value: FormDataEntryValue | null, fallback = "/compte"): string {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return fallback;
}

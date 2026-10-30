// Returns a sized image URL, or "" if there is none or it isn't a safe http(s) URL.
// Unsplash supports resizing through query params; other hosts are left untouched.
export function categoryImageUrl(url, width = 700) {
  if (!url || typeof url !== "string") return "";
  try {
    const u = new URL(url.trim());
    if (!/^https?:$/.test(u.protocol)) return "";
    if (u.hostname.endsWith("unsplash.com")) {
      u.searchParams.set("w", String(width));
      u.searchParams.set("q", "80");
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
    }
    return u.toString();
  } catch {
    return "";
  }
}
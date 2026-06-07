/**
 * Checks if the given hostname represents a root host or local host.
 * Root hosts should be treated as "default" domains.
 */
export function isRootHost(hostname: string): boolean {
  if (!hostname) return true;
  const cleanHost = hostname.split(":")[0].toLowerCase();
  
  return (
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1" ||
    cleanHost === "lvh.me" ||
    cleanHost === "launchstack.in" ||
    cleanHost === "www.launchstack.in" ||
    cleanHost === "vercel.app" ||
    cleanHost.endsWith(".vercel.app")
  );
}

/**
 * Extracts the subdomain/clinic slug from the host header.
 * Returns "default" for root domains, localhost, or deployment URLs.
 */
export function getSubdomainSlug(host: string): string {
  if (!host) return "default";
  
  const hostname = host.split(":")[0].toLowerCase();
  
  if (isRootHost(hostname)) {
    return "default";
  }
  
  // Handle local wildcard subdomains like aksharma.lvh.me
  if (hostname.endsWith(".lvh.me")) {
    const parts = hostname.split(".");
    if (parts.length > 2 && parts[0] !== "www") {
      return parts[0];
    }
  }
  
  // Handle production wildcard subdomains (assuming root domain launchstack.in)
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "launchstack.in";
  if (hostname.endsWith("." + rootDomain)) {
    const sub = hostname.replace("." + rootDomain, "");
    if (sub !== "www") {
      return sub;
    }
  }
  
  // Fallback: if hostname has 3 parts and doesn't match above rules
  const parts = hostname.split(".");
  if (parts.length > 2 && parts[0] !== "www") {
    return parts[0];
  }
  
  return "default";
}

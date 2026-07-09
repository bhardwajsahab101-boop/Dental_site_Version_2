/**
 * Resolves the central platform root domain from environment variables.
 * Falls back to "dental.launchstack.in" if not set.
 */
export function getRootDomain(): string {
  return (
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    process.env.ROOT_DOMAIN ||
    "dental.launchstack.in"
  );
}

export interface TenantInfo {
  isRoot: boolean;        // True if request is for the central platform landing/admin page
  isTenant: boolean;      // True if request is for a clinic's subdomain
  tenantSlug: string;     // The clinic slug (e.g. 'clinicname'), or 'default' if isRoot is true
  cookieDomain: string | undefined; // The wildcard domain for cookie sharing (e.g. '.dental.launchstack.in')
  rootDomain: string;     // The base root domain (e.g. 'dental.launchstack.in' or 'lvh.me')
}

/**
 * Resolves the tenant information from a given host header.
 * Handles localhost, local wildcard domains (lvh.me), Vercel deployments,
 * custom domains, and nested subdomains.
 */
export function resolveTenantInfo(host: string | null | undefined): TenantInfo {
  const configuredRoot = getRootDomain();

  if (!host) {
    return {
      isRoot: true,
      isTenant: false,
      tenantSlug: "default",
      cookieDomain: undefined,
      rootDomain: configuredRoot,
    };
  }

  const hostname = host.split(":")[0].toLowerCase();

  // Helper check for local dev
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  
  // Vercel deployment URLs (e.g., *-vercel.app)
  const isVercel = hostname === "vercel.app" || hostname.endsWith(".vercel.app");

  // Determine if it is a platform/root domain
  const isPlatformRoot =
    isLocalhost ||
    hostname === "lvh.me" ||
    hostname === "www.lvh.me" ||
    isVercel ||
    hostname === configuredRoot ||
    hostname === `www.${configuredRoot}`;

  let tenantSlug = "default";
  let isTenant = false;
  let cookieDomain: string | undefined = undefined;
  let rootDomain = configuredRoot;

  if (isPlatformRoot) {
    // If it's a root/platform domain, isRoot is true, tenantSlug is 'default'
    return {
      isRoot: true,
      isTenant: false,
      tenantSlug: "default",
      cookieDomain: undefined, // No cookie domain sharing needed on pure root/local/vercel domains
      rootDomain: isLocalhost ? "localhost" : isVercel ? hostname : configuredRoot,
    };
  }

  // Otherwise, determine if it's a subdomain/tenant domain.
  // 1. Local subdomains using lvh.me (e.g., clinicname.lvh.me)
  if (hostname.endsWith(".lvh.me")) {
    const parts = hostname.split(".");
    if (parts.length > 2 && parts[0] !== "www") {
      tenantSlug = parts[0];
      isTenant = true;
      cookieDomain = ".lvh.me";
      rootDomain = "lvh.me";
    }
  }
  // 2. Production tenant subdomains under the configured root domain (e.g., clinicname.dental.launchstack.in)
  else if (hostname.endsWith("." + configuredRoot)) {
    const sub = hostname.substring(0, hostname.length - (configuredRoot.length + 1));
    if (sub && sub !== "www") {
      // For nested subdomains, e.g., clinic.sub.root, sub is clinic.sub
      // We extract the first part as the tenant slug
      const parts = sub.split(".");
      tenantSlug = parts[0];
      isTenant = true;
      cookieDomain = `.${configuredRoot}`;
      rootDomain = configuredRoot;
    }
  }
  // 3. Fallback for custom domains or other subdomains:
  // e.g., clinicname.anotherdomain.com
  else {
    const parts = hostname.split(".");
    if (parts.length > 2 && parts[0] !== "www") {
      tenantSlug = parts[0];
      isTenant = true;
      
      const rootParts = parts.slice(1);
      const rootDomainFallback = rootParts.join(".");
      cookieDomain = `.${rootDomainFallback}`;
      rootDomain = rootDomainFallback;
    }
  }

  return {
    isRoot: !isTenant,
    isTenant,
    tenantSlug,
    cookieDomain,
    rootDomain,
  };
}

/**
 * Checks if the given hostname represents a root host or local host.
 * Keeps compatibility with existing usages.
 */
export function isRootHost(hostname: string): boolean {
  return resolveTenantInfo(hostname).isRoot;
}

/**
 * Extracts the subdomain/clinic slug from the host header.
 * Keeps compatibility with existing usages.
 */
export function getSubdomainSlug(host: string): string {
  return resolveTenantInfo(host).tenantSlug;
}

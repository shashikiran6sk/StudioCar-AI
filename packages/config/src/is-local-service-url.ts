import { LOCAL_SERVICE_HOSTNAMES } from "./local-infrastructure";

const IPV4_LOOPBACK_PATTERN = /^127(?:\.\d{1,3}){3}$/;

/**
 * Whether a URL can only address the developer's own machine or the local
 * compose network. An unparseable value is not local.
 */
export function isLocalServiceUrl(value: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(value).hostname.toLowerCase();
  } catch {
    return false;
  }

  return (
    LOCAL_SERVICE_HOSTNAMES.has(hostname) || IPV4_LOOPBACK_PATTERN.test(hostname)
  );
}

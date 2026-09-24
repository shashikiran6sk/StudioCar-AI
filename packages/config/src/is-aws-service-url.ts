import {
  AWS_SERVICE_HOSTNAME_SUFFIX,
  HTTPS_PROTOCOL,
} from "./environment-isolation.constants";

/** Whether a URL is an HTTPS address served by AWS itself. */
export function isAwsServiceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === HTTPS_PROTOCOL &&
      url.hostname.toLowerCase().endsWith(AWS_SERVICE_HOSTNAME_SUFFIX)
    );
  } catch {
    return false;
  }
}

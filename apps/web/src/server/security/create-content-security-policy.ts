import {
  CSP_BASE_URI,
  CSP_CONNECT_SOURCE,
  CSP_DEFAULT_SOURCE,
  CSP_DEVELOPMENT_CONNECT_SOURCE,
  CSP_DEVELOPMENT_SCRIPT_SOURCE,
  CSP_FONT_SOURCE,
  CSP_FORM_ACTION,
  CSP_FRAME_ANCESTORS,
  CSP_IMAGE_SOURCE,
  CSP_MANIFEST_SOURCE,
  CSP_OBJECT_SOURCE,
  CSP_SCRIPT_SOURCE,
  CSP_STYLE_SOURCE,
  CSP_WORKER_SOURCE,
  DEVELOPMENT_ENVIRONMENT,
} from "./security-headers.constants";

/**
 * `localStorageOrigin` is the Local environment's MinIO origin, which browsers
 * upload to and read previews from directly. Deployed storage is AWS S3, which
 * the fixed sources already allow, so it is absent everywhere else.
 */
export function createContentSecurityPolicy(
  nodeEnvironment: string,
  localStorageOrigin?: string,
): string {
  const isDevelopment = nodeEnvironment === DEVELOPMENT_ENVIRONMENT;
  const storageSource =
    localStorageOrigin === undefined ? "" : ` ${localStorageOrigin}`;
  const scriptSource =
    isDevelopment
      ? `${CSP_SCRIPT_SOURCE} ${CSP_DEVELOPMENT_SCRIPT_SOURCE}`
      : CSP_SCRIPT_SOURCE;
  const connectSource = isDevelopment
    ? `${CSP_CONNECT_SOURCE}${storageSource} ${CSP_DEVELOPMENT_CONNECT_SOURCE}`
    : `${CSP_CONNECT_SOURCE}${storageSource}`;

  return [
    CSP_DEFAULT_SOURCE,
    scriptSource,
    CSP_STYLE_SOURCE,
    `${CSP_IMAGE_SOURCE}${storageSource}`,
    CSP_FONT_SOURCE,
    connectSource,
    CSP_WORKER_SOURCE,
    CSP_MANIFEST_SOURCE,
    CSP_OBJECT_SOURCE,
    CSP_BASE_URI,
    CSP_FORM_ACTION,
    CSP_FRAME_ANCESTORS,
  ].join("; ");
}

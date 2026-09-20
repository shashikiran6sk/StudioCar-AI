export const DEVELOPMENT_ENVIRONMENT = "development";
export const SECURITY_HEADERS_SOURCE = "/:path*";

export const CONTENT_SECURITY_POLICY_HEADER = "Content-Security-Policy";
export const CROSS_ORIGIN_OPENER_POLICY_HEADER =
  "Cross-Origin-Opener-Policy";
export const PERMISSIONS_POLICY_HEADER = "Permissions-Policy";
export const REFERRER_POLICY_HEADER = "Referrer-Policy";
export const STRICT_TRANSPORT_SECURITY_HEADER = "Strict-Transport-Security";
export const X_CONTENT_TYPE_OPTIONS_HEADER = "X-Content-Type-Options";
export const X_FRAME_OPTIONS_HEADER = "X-Frame-Options";
export const X_PERMITTED_CROSS_DOMAIN_POLICIES_HEADER =
  "X-Permitted-Cross-Domain-Policies";

export const CROSS_ORIGIN_OPENER_POLICY_VALUE = "same-origin";
export const PERMISSIONS_POLICY_VALUE =
  "camera=(), geolocation=(), microphone=(), payment=(), usb=()";
export const REFERRER_POLICY_VALUE = "strict-origin-when-cross-origin";
export const STRICT_TRANSPORT_SECURITY_VALUE =
  "max-age=63072000; includeSubDomains; preload";
export const X_CONTENT_TYPE_OPTIONS_VALUE = "nosniff";
export const X_FRAME_OPTIONS_VALUE = "DENY";
export const X_PERMITTED_CROSS_DOMAIN_POLICIES_VALUE = "none";

export const CSP_DEFAULT_SOURCE = "default-src 'self'";
export const CSP_SCRIPT_SOURCE = "script-src 'self' 'unsafe-inline'";
export const CSP_DEVELOPMENT_SCRIPT_SOURCE = "'unsafe-eval'";
export const CSP_STYLE_SOURCE = "style-src 'self' 'unsafe-inline'";
export const CSP_IMAGE_SOURCE =
  "img-src 'self' blob: data: https://*.amazonaws.com";
export const CSP_FONT_SOURCE = "font-src 'self' data:";
export const CSP_CONNECT_SOURCE =
  "connect-src 'self' https://*.amazonaws.com";
export const CSP_DEVELOPMENT_CONNECT_SOURCE = "ws: wss:";
export const CSP_WORKER_SOURCE = "worker-src 'self' blob:";
export const CSP_MANIFEST_SOURCE = "manifest-src 'self'";
export const CSP_OBJECT_SOURCE = "object-src 'none'";
export const CSP_BASE_URI = "base-uri 'self'";
export const CSP_FORM_ACTION = "form-action 'self'";
export const CSP_FRAME_ANCESTORS = "frame-ancestors 'none'";

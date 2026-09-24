import { createContentSecurityPolicy } from "./create-content-security-policy";
import {
  CONTENT_SECURITY_POLICY_HEADER,
  CROSS_ORIGIN_OPENER_POLICY_HEADER,
  CROSS_ORIGIN_OPENER_POLICY_VALUE,
  PERMISSIONS_POLICY_HEADER,
  PERMISSIONS_POLICY_VALUE,
  REFERRER_POLICY_HEADER,
  REFERRER_POLICY_VALUE,
  STRICT_TRANSPORT_SECURITY_HEADER,
  STRICT_TRANSPORT_SECURITY_VALUE,
  X_CONTENT_TYPE_OPTIONS_HEADER,
  X_CONTENT_TYPE_OPTIONS_VALUE,
  X_FRAME_OPTIONS_HEADER,
  X_FRAME_OPTIONS_VALUE,
  X_PERMITTED_CROSS_DOMAIN_POLICIES_HEADER,
  X_PERMITTED_CROSS_DOMAIN_POLICIES_VALUE,
} from "./security-headers.constants";
import type { SecurityHeader } from "./security-header.types";

export function createSecurityHeaders(
  nodeEnvironment: string,
  localStorageOrigin?: string,
): SecurityHeader[] {
  return [
    {
      key: CONTENT_SECURITY_POLICY_HEADER,
      value: createContentSecurityPolicy(nodeEnvironment, localStorageOrigin),
    },
    {
      key: CROSS_ORIGIN_OPENER_POLICY_HEADER,
      value: CROSS_ORIGIN_OPENER_POLICY_VALUE,
    },
    { key: PERMISSIONS_POLICY_HEADER, value: PERMISSIONS_POLICY_VALUE },
    { key: REFERRER_POLICY_HEADER, value: REFERRER_POLICY_VALUE },
    {
      key: STRICT_TRANSPORT_SECURITY_HEADER,
      value: STRICT_TRANSPORT_SECURITY_VALUE,
    },
    {
      key: X_CONTENT_TYPE_OPTIONS_HEADER,
      value: X_CONTENT_TYPE_OPTIONS_VALUE,
    },
    { key: X_FRAME_OPTIONS_HEADER, value: X_FRAME_OPTIONS_VALUE },
    {
      key: X_PERMITTED_CROSS_DOMAIN_POLICIES_HEADER,
      value: X_PERMITTED_CROSS_DOMAIN_POLICIES_VALUE,
    },
  ];
}

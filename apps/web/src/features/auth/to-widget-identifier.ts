/**
 * The widget names a handset as bare digits with a country code, not E.164.
 */
export function toWidgetIdentifier(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, "");
}

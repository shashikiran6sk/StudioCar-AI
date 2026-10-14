import type { ProfileIdentityProvider } from "@studiocar/contracts";

export interface ProfileProviderPresentation {
  connectLabel: string;
  description: string;
  label: string;
  provider: ProfileIdentityProvider;
}

export const PROFILE_PROVIDER_PRESENTATIONS: readonly ProfileProviderPresentation[] = [
  {
    provider: "GOOGLE",
    label: "Google",
    connectLabel: "Connect Google",
    description: "OAuth identity with a verified Google email.",
  },
  {
    provider: "PHONE",
    label: "Phone",
    connectLabel: "Connect phone",
    description: "Verified mobile identity secured through one-time codes.",
  },
];

export const PROFILE_CONNECTED_LABEL = "Connected";
export const PROFILE_NOT_CONNECTED_LABEL = "Not connected";
export const PROFILE_LAST_USED_PREFIX = "Last verified";
export const PROFILE_NEVER_USED_LABEL = "Not yet verified";
export const PROFILE_IDENTITIES_TITLE = "Sign-in methods";
export const PROFILE_IDENTITIES_DESCRIPTION =
  "Verified identities that can access this account. Connecting a second method never merges accounts.";
export const PROFILE_GOOGLE_LINKED_MESSAGE = "Google is now connected.";
export const PROFILE_PHONE_LINKED_MESSAGE = "Your phone number is now connected.";
export const PROFILE_LINK_TAKEN_MESSAGE =
  "That sign-in method already belongs to another StudioCar AI account. Sign in with it directly instead.";
export const PROFILE_LINK_GENERIC_ERROR =
  "That sign-in method could not be connected. Please try again.";
export const PROFILE_PATH_FOR_RETURN = "/settings/profile";

export const PROFILE_PAYMENT_HISTORY_ID = "payment-history";
export const PROFILE_PAYMENT_HISTORY_LINK = `${PROFILE_PATH_FOR_RETURN}#${PROFILE_PAYMENT_HISTORY_ID}`;
export const PROFILE_PAYMENT_HISTORY_TITLE = "Payment history";
export const PROFILE_PAYMENT_HISTORY_EMPTY = "No payments yet. Your purchases will appear here.";
export const PROFILE_PAYMENT_HISTORY_DESCRIPTION = "Your latest 100 purchases, including pending and failed payments.";
export const PROFILE_HISTORICAL_PURCHASE_LABEL = "Previous purchase";
export const PROFILE_PAYMENT_HISTORY_COLUMNS = {
  date: "Date", purchase: "Purchase", amount: "Amount", status: "Status", reference: "Reference",
};
export const PROFILE_PAYMENT_ORDER_PREFIX = "Order:";
export const PROFILE_PAYMENT_PROVIDER_PREFIX = "Payment:";
export const PROFILE_PAYMENT_PURCHASE_PREFIX = "Purchase:";

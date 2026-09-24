export const DEVELOPMENT_OTP_TOKEN_PREFIX = "dev-otp:";

export const PHONE_GENERIC_ERROR_MESSAGE =
  "Something went wrong. Please try again.";
export const PHONE_OTP_SENT_MESSAGE = "We sent a verification code to";
export const PHONE_JSON_CONTENT_TYPE = "application/json";
export const PHONE_INPUT_LABEL = "Phone number";
export const PHONE_INPUT_PLACEHOLDER = "+91 98765 43210";
export const PHONE_OTP_INPUT_LABEL = "Verification code";
export const PHONE_OTP_INPUT_PLACEHOLDER = "Enter your OTP";
export const PHONE_PENDING_LABEL = "Sending code…";
export const PHONE_SUBMIT_LABEL = "Continue with phone";
export const PHONE_OTP_PENDING_LABEL = "Verifying…";
export const PHONE_OTP_SUBMIT_LABEL = "Verify and continue";
export const PHONE_CHANGE_NUMBER_LABEL = "Use a different number";
export const PHONE_RESEND_LABEL = "Resend code";
export const PHONE_RESEND_PENDING_LABEL = "Resending…";
export const PHONE_WIDGET_UNAVAILABLE_MESSAGE =
  "Phone sign-in is not available right now. Continue with Google instead.";
export const PHONE_DEVELOPMENT_NOTICE =
  "Development mode: no message is sent. Enter the configured code.";
export const PHONE_CAPTCHA_CONTAINER_CLASS = "auth-form__captcha";
export const PHONE_ACCOUNT_VERIFIED_TITLE = "Phone verified";
export const PHONE_ACCOUNT_CHOICES_DESCRIPTION =
  "We couldn't find an account using this phone number. Choose how you'd like to continue.";
export const PHONE_ACCOUNT_GOOGLE_LABEL = "Link with Google";
export const PHONE_ACCOUNT_CREATE_LABEL = "Create new account";
export const PHONE_ACCOUNT_CREATE_TITLE = "Create your account";
export const PHONE_ACCOUNT_NAME_LABEL = "Name";
export const PHONE_ACCOUNT_CREATING_LABEL = "Creating account…";
export const PHONE_ACCOUNT_CREATE_SUBMIT_LABEL = "Create account";
export const PHONE_ACCOUNT_BACK_LABEL = "Back to choices";
export const PHONE_GOOGLE_BUTTON_LABEL = "Continue with Google";
export const PHONE_GOOGLE_MARK = "G";
export const PHONE_AUTH_DIVIDER_LABEL = "or";
export const PHONE_OAUTH_CANCELLED_MESSAGE =
  "Google linking was cancelled. You can choose another option.";
export const PHONE_SIGNING_IN_MESSAGE = "Signing you in…";
export const PHONE_ACCOUNT_REVERIFY_HTTP_STATUSES = new Set([400, 409]);

export enum PhoneSignInStage {
  EnterPhone = "ENTER_PHONE",
  VerifyOtp = "VERIFY_OTP",
  AccountChoices = "ACCOUNT_CHOICES",
  CreateAccount = "CREATE_ACCOUNT",
  Authenticated = "AUTHENTICATED",
}

export const GOOGLE_LINK_INTENT_QUERY_KEY = "intent";
export const GOOGLE_LINK_INTENT_VALUE = "link";

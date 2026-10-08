export const CHECKOUT_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
export const CHECKOUT_POLL_INTERVAL_MS = 2_000;
export const CHECKOUT_POLL_ATTEMPTS = 15;
export const CHECKOUT_PENDING_MESSAGE = "Payment is pending confirmation. Your credits appear after the captured payment is confirmed.";
export const CHECKOUT_DELAYED_MESSAGE = "Confirmation is delayed. Check again without making another payment, or contact support with your order reference.";
export const CHECKOUT_ERROR_MESSAGE = "Payment could not be completed. Check payment history before trying again.";
export const CHECKOUT_SCRIPT_ERROR_MESSAGE = "Checkout could not load. Refresh the page and try again.";
export const CHECKOUT_REQUEST_TIMEOUT_MS = 10_000;

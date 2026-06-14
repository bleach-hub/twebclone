/**
 * Feature flags for the sign-in card. Mirrors the optional auth methods that
 * tweb shows below the Next button: a QR-code login button (always rendered
 * in tweb) and a passkey login button (shown only if WebAuthn is supported).
 * Toggle these to hide either button.
 */
export const AUTH_CONFIG = {
  showQrLogin: true,
  showPasskeyLogin: true
};

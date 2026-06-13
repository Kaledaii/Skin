// Lightweight monitoring initializer. Initializes Sentry if DSN present.
export function initMonitoring() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || null;
  if (!dsn) return { ok: false, reason: 'no-dsn' };
  try {
    // Prefer @sentry/react-native if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/react-native');
    Sentry.init({ dsn });
    return { ok: true, provider: 'react-native' };
  } catch (err) {
    try {
      // Fallback to browser/node SDK
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Sentry = require('@sentry/browser');
      Sentry.init({ dsn });
      return { ok: true, provider: 'browser' };
    } catch (e) {
      console.warn('Sentry init failed (missing package)', String(e));
      return { ok: false, reason: 'init-failed' };
    }
  }
}

export type AnalyticsEvent =
  | "quiz_started"
  | "quiz_completed"
  | "result_viewed"
  | "paywall_viewed"
  | "premium_clicked"
  | "article_opened"
  | "product_clicked"
  | "routine_completed"
  | "weekly_report_viewed";

export function trackEvent(event: AnalyticsEvent, payload: Record<string, unknown> = {}) {
  const isDev = typeof __DEV__ !== "undefined" && __DEV__;
  if (isDev) {
    console.log(`[analytics] ${event}`, payload);
  }
}

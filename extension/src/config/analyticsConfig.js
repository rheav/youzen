/**
 * Analytics configuration — GA4 Measurement Protocol settings
 *
 * Replace MEASUREMENT_ID and API_SECRET with your own values from the
 * Google Analytics 4 console before enabling analytics.
 *
 * See: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

export const ANALYTICS_CONFIG = {
  /** GA4 Measurement ID (e.g. G-XXXXXXXXXX) */
  MEASUREMENT_ID: 'G-XXXXXXXXXX',

  /** GA4 Measurement Protocol API secret */
  API_SECRET: '',
};

/**
 * Predefined event names.
 * Using constants avoids typo-related tracking gaps.
 */
export const EVENTS = {
  TAB_SWITCHED: 'tab_switched',
  FEATURE_USED: 'feature_used',
  ERROR_OCCURRED: 'error_occurred',
  SIDEPANEL_OPENED: 'sidepanel_opened',
};

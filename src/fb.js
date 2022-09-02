import load from 'load-script-once';

/* global fbq */

const config = {
  /**
   * The Meta Pixel ID for your site.
   */
  pixelId: '',
};

/**
 * Initializes all the analytics setup. Creates trackers and sets initial
 * values on the trackers.
 *
 * @param {Object=} opts
 */
export const init = (opts = {}) => {
  // Initialize the command queue in case fbevents.js hasn't loaded yet.
  initializeTrackerQueue();

  // Merge defaults and options
  Object.assign(config, opts);

  loadLibrary();
  createTracker();
};

/**
 * Load analytics.js
 */
const loadLibrary = () => {
  load('https://connect.facebook.net/en_US/fbevents.js');
};

/**
 * Sends a default event.
 *
 * @param {Object} eventData
 */
export const trackEvent = ({ eventName, eventData = null } = {}) => {
  fbq('track', eventName, eventData);
};

/**
 * Sends a custom event.
 *
 * @param {Object} eventData
 */
export const trackCustomEvent = ({ eventName, eventData = {} } = {}) => {
  fbq('trackCustom', eventName, eventData);
};

/**
 * Manually sends a page view.
 *
 */
export const trackPageview = () => {
  fbq('track', 'PageView');
};

/**
 * Creates the tracker.
 */
const createTracker = () => {
  fbq('init', config.pixelId);
  fbq('track', 'PageView');
};

/**
 * Creates the tracker queue.
 */
const initializeTrackerQueue = () => {
  if (window.fbq) {
    return;
  }

  const n = (window.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  });
  if (!window._fbq) {
    window._fbq = n;
  }
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];
};

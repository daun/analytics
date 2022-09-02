import load from 'load-script-once';

/* global _paq */

const config = {
  /**
   * The base URL of your Matomo installation.
   */
  installationUrl: '/matomo/',

  /**
   * The site ID for your Matomo property.
   */
  siteId: '',
};

/**
 * Initializes all the analytics setup. Creates trackers and sets initial
 * values on the trackers.
 *
 * @param {Object=} opts
 */
export const init = (opts = {}) => {
  // Initialize the command queue in case matomo.js hasn't loaded yet.
  window._paq = window._paq || [];

  // Merge defaults and options
  Object.assign(config, opts);

  loadLibrary();
  createTracker();
};

/**
 * Load analytics.js
 */
const loadLibrary = () => {
  load(`${config.installationUrl}matomo.js`);
};

/**
 * Sends a custom event.
 *
 * @param {Object} eventData
 */
export const trackEvent = ({
  eventCategory,
  eventAction,
  eventLabel = config.nullValue,
} = {}) => {
  _paq.push(['trackEvent', eventCategory, eventAction, eventLabel]);
};

/**
 * Manually sends a page view.
 *
 * @param {String} pathname
 */
export const trackPageview = (pathname) => {
  const location =
    pathname || window.location.pathname + window.location.search;

  _paq.push(['setReferrerUrl', location]);
  _paq.push(['setCustomUrl', location]);
  _paq.push(['setDocumentTitle', document.title]);
  _paq.push(['deleteCustomVariables', 'page']);
  _paq.push(['trackPageView']);
};

/**
 * Creates the tracker.
 */
const createTracker = () => {
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  _paq.push(['setTrackerUrl', `${config.installationUrl}matomo.php`]);
  _paq.push(['setSiteId', config.siteId]);
};

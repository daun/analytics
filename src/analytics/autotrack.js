// Import the individual autotrack plugins you want to use.
import 'autotrack/lib/plugins/clean-url-tracker';
import 'autotrack/lib/plugins/max-scroll-tracker';
import 'autotrack/lib/plugins/outbound-link-tracker';
import 'autotrack/lib/plugins/page-visibility-tracker';
import 'autotrack/lib/plugins/url-change-tracker';
import load from 'load-script-once';


/* global ga */


const config = {
  /**
   * The tracking ID for your Google Analytics property.
   * https://support.google.com/analytics/answer/1032385
   */
  trackingId: '',

  /**
   * Bump this when making backwards incompatible changes to the tracking
   * implementation. This allows you to create a segment or view filter
   * that isolates only data captured with the most recent tracking changes.
   */
  trackingVersion: '1',

  /**
   * This setting can be used to more accurately predict session boundaries.
   * Note: if your property contains views in several different time zones,
   * do not use this setting.
   */
  timeZone: 'Europe/London',

  /**
   * A default value for dimensions so unset values always are reported as
   * something. This is needed since Google Analytics will drop empty dimension
   * values in reports.
   */
  nullValue: '(not set)',

  /**
   * To anonymize the IP address for all hits, set this to true.
   */
  anonymizeIp: true,

  /**
   * To remove trailing slashes from urls, set this to true.
   */
  removeTrailingSlash: true,
};


/**
 * A mapping between custom dimension names and their indexes.
 */
const dimensions = {
  TRACKING_VERSION: 'dimension1',
  CLIENT_ID: 'dimension2',
  WINDOW_ID: 'dimension3',
  HIT_ID: 'dimension4',
  HIT_TIME: 'dimension5',
  HIT_TYPE: 'dimension6',
  HIT_SOURCE: 'dimension7',
  VISIBILITY_STATE: 'dimension8',
  URL_QUERY_PARAMS: 'dimension9',
};


/**
 * A mapping between custom metric names and their indexes.
 */
const metrics = {
  RESPONSE_END_TIME: 'metric1',
  DOM_LOAD_TIME: 'metric2',
  WINDOW_LOAD_TIME: 'metric3',
  PAGE_VISIBLE: 'metric4',
  MAX_SCROLL_PERCENTAGE: 'metric5',
  PAGE_LOADS: 'metric6',
};


/**
 * Initializes all the analytics setup. Creates trackers and sets initial
 * values on the trackers.
 *
 * @param {Object=} opts
 */
export const init = (opts = {}) => {
  // Initialize the command queue in case analytics.js hasn't loaded yet.
  window.ga = window.ga || ((...args) => (ga.q = ga.q || []).push(args));

  // Merge defaults and options
  Object.assign(config, opts);

  loadLibrary();
  createTracker();
  trackErrors();
  trackCustomDimensions();
  requireAutotrackPlugins();
  sendNavigationTimingMetrics();
};

/**
 * Load analytics.js
 */
const loadLibrary = () => {
  load('https://www.google-analytics.com/analytics.js');
};

/**
 * Tracks a JavaScript error with optional fields object overrides.
 * This function is exported so it can be used in other parts of the codebase.
 * E.g.:
 *
 *    `fetch('/api.json').catch(trackError);`
 *
 * @param {(Error|Object)=} err
 * @param {Object=} fieldsObj
 */
export const trackError = (err = {}, fieldsObj = {}) => {
  ga('send', 'event', Object.assign({
    eventCategory: 'Error',
    eventAction: err.name || '(no error name)',
    eventLabel: `${err.message}\n${err.stack || '(no stack trace)'}`,
    nonInteraction: true,
  }, fieldsObj));
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
  ga('send', 'event', {eventCategory, eventAction, eventLabel});
};


/**
 * Creates the trackers and sets the default transport and tracking
 * version fields. In non-production environments it also logs hits.
 */
const createTracker = () => {
  ga('create', config.trackingId, 'auto');
  // Anonymize IPs
  ga('set', 'anonymizeIp', config.anonymizeIp);
  // Ensures all hits are sent via `navigator.sendBeacon()`.
  ga('set', 'transport', 'beacon');
};


/**
 * Tracks any errors that may have occured on the page prior to analytics being
 * initialized, then adds an event handler to track future errors.
 */
const trackErrors = () => {
  // Errors that have occurred prior to this script running are stored on
  // `window.__e.q`, as specified in `index.html`.
  const loadErrorEvents = window.__e && window.__e.q || [];

  const trackErrorEvent = (event) => {
    // Use a different eventCategory for uncaught errors.
    const fieldsObj = {eventCategory: 'Uncaught Error'};

    // Some browsers don't have an error property, so we fake it.
    const err = event.error || {
      message: `${event.message} (${event.lineno}:${event.colno})`,
    };

    trackError(err, fieldsObj);
  };

  // Replay any stored load error events.
  for (let event of loadErrorEvents) {
    trackErrorEvent(event);
  }

  // Add a new listener to track event immediately.
  window.addEventListener('error', trackErrorEvent);
};


/**
 * Sets a default dimension value for all custom dimensions on all trackers.
 */
const trackCustomDimensions = () => {
  // Sets a default dimension value for all custom dimensions to ensure
  // that every dimension in every hit has *some* value. This is necessary
  // because Google Analytics will drop rows with empty dimension values
  // in your reports.
  Object.keys(dimensions).forEach((key) => {
    ga('set', dimensions[key], config.nullValue);
  });

  // Adds tracking of dimensions known at page load time.
  ga((tracker) => {
    tracker.set({
      [dimensions.TRACKING_VERSION]: config.trackingVersion,
      [dimensions.CLIENT_ID]: tracker.get('clientId'),
      [dimensions.WINDOW_ID]: uuid(),
    });
  });

  // Adds tracking to record each the type, time, uuid, and visibility state
  // of each hit immediately before it's sent.
  ga((tracker) => {
    const originalBuildHitTask = tracker.get('buildHitTask');
    tracker.set('buildHitTask', (model) => {
      const qt = model.get('queueTime') || 0;
      model.set(dimensions.HIT_TIME, String(new Date - qt), true);
      model.set(dimensions.HIT_ID, uuid(), true);
      model.set(dimensions.HIT_TYPE, model.get('hitType'), true);
      model.set(dimensions.VISIBILITY_STATE, document.visibilityState, true);

      originalBuildHitTask(model);
    });
  });
};


/**
 * Requires select autotrack plugins and initializes each one with its
 * respective configuration options.
 */
const requireAutotrackPlugins = () => {
  ga('require', 'cleanUrlTracker', {
    stripQuery: true,
    queryDimensionIndex: getDefinitionIndex(dimensions.URL_QUERY_PARAMS),
    trailingSlash: config.removeTrailingSlash ? 'remove' : null,
  });
  ga('require', 'maxScrollTracker', {
    sessionTimeout: 30,
    timeZone: config.timeZone,
    maxScrollMetricIndex: getDefinitionIndex(metrics.MAX_SCROLL_PERCENTAGE),
  });
  ga('require', 'outboundLinkTracker', {
    events: ['click', 'contextmenu'],
  });
  ga('require', 'pageVisibilityTracker', {
    sendInitialPageview: true,
    pageLoadsMetricIndex: getDefinitionIndex(metrics.PAGE_LOADS),
    visibleMetricIndex: getDefinitionIndex(metrics.PAGE_VISIBLE),
    fieldsObj: {[dimensions.HIT_SOURCE]: 'pageVisibilityTracker'},
    timeZone: config.timeZone,
  });
  ga('require', 'urlChangeTracker', {
    fieldsObj: {[dimensions.HIT_SOURCE]: 'urlChangeTracker'},
  });
};


/**
 * Gets the DOM and window load times and sends them as custom metrics to
 * Google Analytics via an event hit.
 */
const sendNavigationTimingMetrics = () => {
  // Only track performance in supporting browsers.
  if (!(window.performance && window.performance.timing)) return;

  // If the window hasn't loaded, run this function after the `load` event.
  if (document.readyState != 'complete') {
    window.addEventListener('load', sendNavigationTimingMetrics);
    return;
  }

  const nt = performance.timing;
  const navStart = nt.navigationStart;

  const responseEnd = Math.round(nt.responseEnd - navStart);
  const domLoaded = Math.round(nt.domContentLoadedEventStart - navStart);
  const windowLoaded = Math.round(nt.loadEventStart - navStart);

  // In some edge cases browsers return very obviously incorrect NT values,
  // e.g. 0, negative, or future times. This validates values before sending.
  const allValuesAreValid = (...values) => {
    return values.every((value) => value > 0 && value < 6e6);
  };

  if (allValuesAreValid(responseEnd, domLoaded, windowLoaded)) {
    ga('send', 'event', {
      eventCategory: 'Navigation Timing',
      eventAction: 'track',
      eventLabel: config.nullValue,
      nonInteraction: true,
      [metrics.RESPONSE_END_TIME]: responseEnd,
      [metrics.DOM_LOAD_TIME]: domLoaded,
      [metrics.WINDOW_LOAD_TIME]: windowLoaded,
    });
  }
};


/**
 * Accepts a custom dimension or metric and returns it's numerical index.
 * @param {string} definition The definition string (e.g. 'dimension1').
 * @return {number} The definition index.
 */
const getDefinitionIndex = (definition) => +/\d+$/.exec(definition)[0];


/**
 * Generates a UUID.
 * https://gist.github.com/jed/982883
 * @param {string|undefined=} a
 * @return {string}
 */
const uuid = function b(a) {
  return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) :
      ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
};

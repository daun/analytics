# Analytics Boilerplate

Easy way to get up and running with Google Analytics.

Personalized version of the original
[analyticsjs-boilerplate](https://github.com/philipwalton/analyticsjs-boilerplate),
with a few additions:

- Make it configurable by passing options on `init()`
- Allow sending custom events and page views
- Autoload the `analytics.js` script

## Installation

```bash
npm install @daun/analytics
```

## Usage

This package **automatically loads the Google Analytics library**.

### Async

Recommended: load tracking code lazily so it's non-blocking.

```js
import('@daun/analytics').then(analytics => {
  analytics.init({ /* options */ })
})
```

### Sync

Only recommended for standalone entrypoints.

```js
import { init } from '@daun/analytics'

init({ /* options */ })
```

## API

### init

Setup the tracker and set initial values.

```js
init({
  trackingId: 'UA-X-XXXXXX',
  timeZone: 'Europe/London'
})
```

**Options**

- `trackingId` → Google Analytics tracking ID, required
- `timeZone` → Time zone (default: Europe/London)
- `anonymizeIp` → Anonymize last IP octet? (default: true)
- `removeTrailingSlash` → Remove trailing slash (default: true)

### trackEvent

Track a custom event.

```js
trackEvent({
  eventCategory: 'Video',
  eventAction: 'play',
  eventLabel: 'Video title'
})
```

### trackPageview

Track a page view. This should only be required in rare cases where
autotracking URL changes is not sufficient.

```js
trackPageview('/some/page')
```

## Autotrack

This setup includes a few useful [autotrack](https://github.com/googleanalytics/autotrack) plugins:

- clean-url-tracker
- max-scroll-tracker
- outbound-link-tracker
- page-visibility-tracker
- url-change-tracker

# Original Readme

For an in-depth explanation of all the features used in this boilerplate (as well as how to report on them), see my article:

[**The Google Analytics Setup I Use on Every Site I Build**](https://philipwalton.com/articles/the-google-analytics-setup-i-use-on-every-site-i-build/) &#8594;

## Boilerplate versions

### [`analytics/base.js`](/src/analytics/base.js)

The base boilerplate extends the [default tracking snippet](https://developers.google.com/analytics/devguides/collection/analyticsjs/#alternative_async_tracking_snippet) and includes the following features:

- Tracks uncaught errors.
- Tracks custom user, session, and hit-level dimensions.
- Sends an initial pageview.
- Sends a pageload performance event.

### [`analytics/autotrack.js`](/src/analytics/autotrack.js)

The autotrack boilerplate builds on top the base boilerplate and includes [select autotrack plugins](https://philipwalton.com/articles/the-google-analytics-setup-i-use-on-every-site-i-build/#using-autotrack-plugins)

### [`analytics/multiple-trackers.js`](/src/analytics/multiple-trackers.js)

The multiple-trackers boilerplate builds on the autotrack boilerplate and includes support for using [multiple trackers](https://philipwalton.com/articles/the-google-analytics-setup-i-use-on-every-site-i-build/#testing-your-implementation).

## Running the boilerplate locally

analytics.js boilerplate uses [webpack](https://webpack.js.org/) to compile the source and [webpack-dev-server](https://github.com/webpack/webpack-dev-server) to run it locally.

To install the dependencies and load the boilerplate in a browser, run the following commands:

```sh
npm install
npm start
```

Then visit [localhost:8080](http://localhost:8080) in your browser and open the developer console to see the analytics.js debug output.

### Running different boilerplate versions

The boilerplate [`index.js`](/src/index.js#L7) JavaScript file imports the base boilerplate by default. To run a different version, replace the URL imported via `import('./analytics/base.js')` with the version you want to load.

/**
 * @license
 * Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
import * as _ from 'lodash';
import * as launchpad from 'launchpad';
import * as wd from 'wd';

const LAUNCHPAD_TO_SELENIUM: {[browser: string]: (browser: launchpad.Browser) => wd.Capabilities} = {
  chrome:  chrome,
  canary:  chrome,
  firefox: firefox,
  aurora:  firefox,
  ie:      internetExplorer,
  // Until https://code.google.com/p/selenium/issues/detail?id=7933
  safari:  safari,
};

/**
 * @param {Array<string|!Object>} browsers
 * @return {!Array<string>}
 */
function normalize(browsers: (string | {browserName: string})[]) {
  return (browsers || []).map(function(browser) {
    if (typeof browser === 'string') {
      return browser;
    }
    return browser.browserName;
  });
}

/**
 * Expands an array of browser identifiers for locally installed browsers into
 * their webdriver capabilities objects.
 *
 * If `names` is empty, or contains `all`, all installed browsers will be used.
 *
 * @param {!Array<string>} names
 * @param {function(*, Array<!Object>)} done
 */
function expand(names: string[], done: (err: any, capabilities?: wd.Capabilities[]) => void) {
  if (names.indexOf('all') !== -1) {
    names = [];
  }

  const unsupported = _.difference(names, module.exports.supported());
  if (unsupported.length > 0) {
    return done(
        'The following browsers are unsupported: ' + unsupported.join(', ') + '. ' +
        '(All supported browsers: ' + module.exports.supported().join(', ') + ')'
    );
  }

  detect(function(error, installedByName) {
    if (error) return done(error);
    const installed = _.keys(installedByName);
    // Opting to use everything?
    if (names.length === 0) {
      names = installed;
    }

    const missing   = _.difference(names, installed);
    if (missing.length > 0) {
      return done(
          'The following browsers were not found: ' + missing.join(', ') + '. ' +
          '(All installed browsers found: ' + installed.join(', ') + ')'
      );
    }

    done(null, names.map(function(n) { return installedByName[n]; }));
  });
}

/**
 * Detects any locally installed browsers that we support.
 *
 * @param {function(*, Object<string, !Object>)} done
 */
export function detect(done: (err: any, capabilities?: {[browser: string]: wd.Capabilities}) => void) {
  launchpad.local(function(error, launcher) {
    if (error) return done(error);
    launcher.browsers(function(error, browsers) {
      if (error) return done(error);

      const results: {[browser: string]: wd.Capabilities} = {};
      for (const browser of browsers) {
        if (!LAUNCHPAD_TO_SELENIUM[browser.name]) continue;
        const converter = LAUNCHPAD_TO_SELENIUM[browser.name];
        results[browser.name] = converter(browser);
      }

      done(null, results);
    });
  });
}

/**
 * @return {!Array<string>} A list of local browser names that are supported by
 *     the current environment.
 */
function supported() {
  return _.intersection(
      Object.keys(launchpad.local.platform),
      Object.keys(LAUNCHPAD_TO_SELENIUM));
}

// Launchpad -> Selenium

/**
 * @param {!Object} browser A launchpad browser definition.
 * @return {!Object} A selenium capabilities object.
 */
function chrome(browser: launchpad.Browser): wd.Capabilities {
  return {
    'browserName': 'chrome',
    'version':     browser.version.match(/\d+/)[0],
    'chromeOptions': {
      'binary': browser.binPath,
      'args': ['start-maximized']
    },
  };
}

/**
 * @param {!Object} browser A launchpad browser definition.
 * @return {!Object} A selenium capabilities object.
 */
function firefox(browser: launchpad.Browser): wd.Capabilities {
  return {
    'browserName':    'firefox',
    'version':        browser.version.match(/\d+/)[0],
    'firefox_binary': browser.binPath,
    'marionette': true
  };
}

/**
 * @param {!Object} browser A launchpad browser definition.
 * @return {!Object} A selenium capabilities object.
 */
function safari(browser: launchpad.Browser): wd.Capabilities {
  // SafariDriver doesn't appear to support custom binary paths. Does Safari?
  return {
    'browserName': 'safari',
    'version':     browser.version,
    // TODO(nevir): TEMPORARY. https://github.com/Polymer/web-component-tester/issues/51
    'safari.options': {
      'skipExtensionInstallation': true,
    },
  };
}

/**
 * @param {!Object} browser A launchpad browser definition.
 * @return {!Object} A selenium capabilities object.
 */
function internetExplorer(browser: launchpad.Browser): wd.Capabilities {
  return {
    'browserName': 'internet explorer',
    'version':     browser.version,
  };
}

module.exports = {
  normalize: normalize,
  detect:    detect,
  expand:    expand,
  supported: supported,
};

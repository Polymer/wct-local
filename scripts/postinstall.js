/**
 * @license
 * Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

// Work around a potential npm race condition:
// https://github.com/npm/npm/issues/6624
function requireSelenium(done, attempt) {
  attempt = attempt || 0;
  var selenium;
  try {
    selenium = require('selenium-standalone');
  } catch (error) {
    if (attempt > 3) { throw error; }
    setTimeout(
      requireSelenium.bind(null, done, attempt + 1),
      Math.pow(2, attempt) // Exponential backoff to play it safe.
    );
  }
  // All is well.
  done(selenium);
}

var config = {
  version: '2.53.0',
  logger:  console.log.bind(console),
  basePath: `${__dirname}/../drivers`,
  drivers: {
    safari: {
      version: '2.48',
      arch: process.arch
    },
    chrome: {
      version: '2.9',
      arch: process.arch
    },
    opera: {
      version: '0.2.2',
      arch: process.arch
    },
    ie: {
      version: '2.53',
      arch: process.arch
    },
    edge: {
      version: '2.10586',
      arch: process.arch
    },
    firefox: {
      arch: process.arch
    }
  }
};

if (!process.env.NOSELENIUM) {
  requireSelenium(function(selenium) {
    console.log(config);
    selenium.install(config, function(error) {
      if (error) {
        console.log('Failed to download the selenium browser drivers:');
        console.log(error.stack || error.message || error);
        process.exit(1);
      }
    });
  });
} else {
  console.log('skipping install of selenium because of NOSELENIUM flag');
}

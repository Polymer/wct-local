/**
 * @license
 * Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
import * as chalk from 'chalk';
import * as cleankill from 'cleankill';
import * as freeport from 'freeport';
import * as selenium from 'selenium-standalone';
import * as which from 'which';
import * as child_process from 'child_process';

const SELENIUM_VERSION: string = require('../package.json')['selenium-version'];

//TODO: import Config from typescriptified wct
interface Config {
  emit(name: string, ...args: string[]): void;
}

type Args = string[];

export function checkSeleniumEnvironment(done: (err?: any) => void) {
  which('java', function(error) {
    if (!error) return done();

    let message = 'java is not present on your PATH.';
    if (process.platform === 'win32') {
      message = message + '\n\n  Please install it: https://java.com/download/\n\n';
    } else if (process.platform === 'linux') {
      try {
        which.sync('apt-get');
        message = message + '\n\n  sudo apt-get install default-jre\n\n';
      } catch (error) {
        // There's not a clear default package for yum distros.
      }
    }

    done(message);
  });
}

export function startSeleniumServer(wct: Config, args: string[], done: (err?: any) => void) {
  wct.emit('log:info', 'Starting Selenium server for local browsers now ok.');
  const opts = {args: args, install: false};
  checkSeleniumEnvironment(seleniumStart(wct, opts, done));
}

export function installAndStartSeleniumServer(wct: Config, args: string[], done: (err?: any) => void) {
  wct.emit('log:info', 'Installing and starting Selenium server for local browsers now ok yes.');
  const opts = {args: args, install: true};
  checkSeleniumEnvironment(seleniumStart(wct, opts, done));
}

function seleniumStart(wct: Config, opts: {args: string[], install: boolean}, done: (err?: any, port?: number) => void) {
  return function(error?: any) {
    if (error) return done(error);
    freeport(function(error, port) {
      if (error) return done(error);

      // See below.
      const log: string[] = [];
      function onOutput(data: any) {
        const message = data.toString();
        log.push(message);
        wct.emit('log:debug', message);
      }

      const config: selenium.StartOpts = {
        seleniumArgs: ['-port', port.toString()].concat(opts.args),
        // Bookkeeping once the process starts.
        spawnCb: function(server: child_process.ChildProcess) {
          // Make sure that we interrupt the selenium server ASAP.
          cleankill.onInterrupt(function(done) {
            server.kill();
            done();
          });

          server.stdout.on('data', onOutput);
          server.stderr.on('data', onOutput);
        },
      };

      function install() {
        selenium.install({version: SELENIUM_VERSION, logger: onOutput}, function(error) {
          if (error) {
            log.forEach((line) => wct.emit('log:info', line));
            return done(error);
          }
          start();
        });
      }

      function start() {
        selenium.start(config, function(error) {
          if (error) {
            log.forEach((line) => wct.emit('log:info', line));
            return done(error);
          }
          wct.emit('log:info', 'Selenium server running on port', chalk.yellow(port.toString()));
          done(null, port);
        });
      }

      if (opts.install) {
        install();
      } else {
        start();
      }
    });
  };
}

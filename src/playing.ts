import * as webdriver from 'selenium-webdriver';
import * as firefox from 'selenium-webdriver/firefox';
import * as os from 'os';
import * as fs from 'fs';

function getFirefox() {
  const capabilities = webdriver.Capabilities.firefox();
  capabilities.set('marionette', true);
  const binary = new firefox.Binary('/Applications/Firefox.app/Contents/MacOS/firefox-bin');
  const options = new firefox.Options();
  options.setBinary(binary);

  return new webdriver.Builder()
      .withCapabilities(capabilities)
      .setFirefoxOptions(options)
      .build();
}

function getChrome(version?: string) {
  return new webdriver.Builder()
      .forBrowser('chrome', version)
      .build();
}

const system = `${os.platform()}_${process.arch}`;
const geckoDriverPath = {
  linux_x64: 'https://github.com/mozilla/geckodriver/releases/download/v0.8.0/geckodriver-0.8.0-linux64.gz',
  darwin_x64: 'https://github.com/mozilla/geckodriver/releases/download/v0.8.0/geckodriver-0.8.0-OSX.gz',
}[system];

const chromeDriverPath = {
  darwin_x64: 'http://chromedriver.storage.googleapis.com/2.9/chromedriver_mac32.zip'
}[system];

if (!geckoDriverPath) {
  throw new Error(`Don't know how to get gecko driver for ${system}`);
}

if (!chromeDriverPath) {
  throw new Error(`Don't know how to get chrome driver for ${system}`);
}

function exists(filename: string) {
  try {
    fs.statSync(filename);
    return true;
  } catch (_) {
    return false;
  }
}

async function main() {
  process.env.PATH = `${process.env.PATH}:${__dirname}/../drivers/`;
  const By = webdriver.By;
  const until = webdriver.until;

  const driver = getChrome();

  // driver.get('http://www.google.com/ncr');
  // driver.findElement(By.name('q')).sendKeys('webdriver');
  // driver.findElement(By.name('btnG')).click();
  // driver.wait(until.titleIs('webdriver - Google Search'), 1000);
  // await driver.quit();
  // return;

  console.log('getting countdown');
  await driver.get('https://summit-countdown.com/');
  const elem = await driver.findElement(By.css('summit-countdown'));
  const text = await elem.getText();
  console.log(text);
  // console.log(await driver.executeScript('document.querySelector("summit-countdown").length'));
  console.log('got countdown');

  await new Promise((resolve) => setTimeout(resolve, 10000));

  console.log((await driver.getSession()));

  await driver.quit();
}

main().then(() => {
  console.log('finished successfully');
}, (error) => {
  console.error(error.stack);
});

import Debug from "debug";
Debug.enable("impftermin:*");
import puppeteer, { Page } from "puppeteer-core";
import { Config, ConfigQueueEntry, loadConfiguration } from "./configuration";
import { SOUND_BASE64 } from "./sound.base64";
import { sendTelegramMessage } from "./telegram";
import { checkForUrlWithCode } from "./zentrum";
import { tmpdir } from "os";
import * as path from "path";
const debug = Debug("impftermin:main");
import { bgRedBright, whiteBright } from "chalk";

export const coloredError = (...text: unknown[]) =>
  bgRedBright(whiteBright(...text));

debug("Launching Impftermin");

(async () => {
  const configuration = await loadConfiguration();

  const tmpPath = tmpdir();
  const chromePath = path.resolve(path.join(tmpPath, ".local-chromium"));

  debug("Downloading Chromium...");
  const browserFetcher = (puppeteer as any).createBrowserFetcher({
    path: chromePath,
  });
  const revisionInfo = await browserFetcher.download(
    (puppeteer as any)._preferredRevision // use an older revision!
  );
  debug("Download successful.");

  const browser = await puppeteer.launch({
    executablePath: revisionInfo.executablePath,
    args: ["--incognito", "--enable-resource-load-scheduler=false"],

    headless: false,
  });
  const page = (await browser.pages())[0];

  sendTelegramMessage("Impftermin active");

  // plays a sound - we do not care about cleanup here (script tag will remain on page)
  await page.addScriptTag({
    content: `new Audio("data:audio/wav;base64,${SOUND_BASE64}").play();`,
  });
  await page.waitForTimeout(3000);
  // await page.close();

  await runChecksInParallel(browser, configuration);
})();

function minutesToText(timeInMinutes: number) {
  const date = new Date();

  const nextDate = new Date(date.getTime() + timeInMinutes * 60000);

  return `${nextDate.getHours()}:${
    (nextDate.getMinutes() < 10 ? "0" : "") + nextDate.getMinutes()
  }`;
}

async function clearBrowserCookies(page: Page) {
  const client = await page.target().createCDPSession();
  await client.send("Network.clearBrowserCookies");
}

async function checkEntryInPage(
  page: puppeteer.Page,
  configuration: Config,
  entry: ConfigQueueEntry
) {
  await clearBrowserCookies(page);
  if (await checkForUrlWithCode(page, entry.url, entry.code)) {
    sendTelegramMessage("Appointments available!!!");
    await page.bringToFront();
    await page.addScriptTag({
      content: `new Audio("data:audio/wav;base64,${SOUND_BASE64}").play();`,
    });
    // stop scraper for 15 minutes after a hit
    setTimeout(
      () => checkEntryInPage(page, configuration, entry),
      1000 * 60 * 15
    );
    return;
  }

  const nextTimeout =
    entry.code !== undefined
      ? configuration.intervalWithCodeInMinutes
      : configuration.intervalInMinutes;

  debug(
    `Next check in ${nextTimeout} minutes (at ${minutesToText(nextTimeout)})`
  );
  setTimeout(
    () => checkEntryInPage(page, configuration, entry),
    1000 * 60 * nextTimeout
  );
}

async function runChecksInParallel(
  browser: puppeteer.Browser,
  configuration: Config
) {
  debug("Running checks in parallel");
  for (const entry of configuration.queue) {
    const context = await browser.createIncognitoBrowserContext();
    const incognitoPage = await context.newPage();
    checkEntryInPage(incognitoPage, configuration, entry);
  }
}

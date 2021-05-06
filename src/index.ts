import Debug from "debug";
Debug.enable("impftermin:*");
import puppeteer from "puppeteer-core";
import { loadConfiguration } from "./configuration";
import { SOUND_BASE64 } from "./sound.base64";
import { sendTelegramMessage } from "./telegram";
import { checkForUrlWithCode } from "./zentrum";
import { tmpdir } from "os";
import * as path from "path";
const debug = Debug("impftermin:main");

debug("Launching Impftermin");

(async () => {
  const configuration = loadConfiguration();

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
    headless: false,
  });
  const page = (await browser.pages())[0];

  sendTelegramMessage("Impftermin active");

  // plays a sound - we do not care about cleanup here (script tag will remain on page)
  await page.addScriptTag({
    content: `new Audio("data:audio/wav;base64,${SOUND_BASE64}").play();`,
  });
  await page.waitForTimeout(3000);

  const getNextCheckTime = () => {
    const date = new Date();

    const nextDate = new Date(
      date.getTime() + configuration.intervalInMinutes * 60000
    );

    return `${nextDate.getHours()}:${nextDate.getMinutes()}`;
  };

  const runChecks = async () => {
    for (const entry of configuration.queue) {
      if (await checkForUrlWithCode(page, entry.url, entry.code)) {
        // appointments available!!!
        sendTelegramMessage("Appointments available!!!");
        await page.addScriptTag({
          content: `new Audio("data:audio/wav;base64,${SOUND_BASE64}").play();`,
        });
        // stop scraper for 25 minutes after a hit
        setTimeout(() => runChecks(), 1000 * 60 * 25);
        return;
      }
    }
    debug(
      `Next check in ${
        configuration.intervalInMinutes
      } minutes (at ${getNextCheckTime()})`
    );
    setTimeout(() => runChecks(), 1000 * 60 * configuration.intervalInMinutes);
  };
  await runChecks();
})();

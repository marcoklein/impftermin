import Debug from "debug";
import { Page } from "puppeteer-core";
import { checkForAppointments } from "./appointments";
import { sendTelegramMessage } from "./telegram";
import { coloredError } from "./index";
const debug = Debug("impftermin:zentrum");

export async function checkForUrlWithCode(
  page: Page,
  impfZentrumUrl: string,
  impfCode: string | undefined
) {
  debug("Performing a check for location with url %s", impfZentrumUrl);
  try {
    const hasAppointments = await checkForAppointments(
      page,
      impfZentrumUrl,
      1000 * 60 * 30, // max 30 min in waiting room, then refresh page
      impfCode
    );
    if (hasAppointments) {
      await page.waitForTimeout(1000);
      return true;
    }
  } catch (e) {
    debug(coloredError("Error during retrieval", e));
    sendTelegramMessage("ERROR during appointment retrieval " + e);
  }
  return false;
}

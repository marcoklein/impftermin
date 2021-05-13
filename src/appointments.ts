import { Page } from "puppeteer-core";
import Debug from "debug";
const debug = Debug("impftermin:appointments");

/**
 * Sit in the waiting room.
 *
 * @param page Page to use.
 * @param maxWaitingTime
 * @returns True, if the waiting was successful. False if we waited longer than the maximum wait time.
 */
async function sitInWaitingRoom(page: Page, maxWaitingTime: number) {
  const isInWaitingRoom = async () => {
    const title$ = await page.$("h1");
    if (title$) {
      const titleText = await (
        await title$.getProperty("innerText")
      )?.jsonValue<string>();
      if (titleText && titleText.includes("Warteraum")) {
        return true;
      }
    }
    return false;
  };
  const inWaitingRoomTimestamp = Date.now();
  while (true) {
    // the page will refresh automatically when we are in the waiting room
    // we throw an error if the waiting room does not refresh after 10 minutes
    await page.waitForNavigation({
      waitUntil: "networkidle0",
      timeout: 1000 * 60 * 10, // 10 minutes
    });

    if (!(await isInWaitingRoom())) {
      debug("We are no longer in the waiting room");
      break;
    }
    const waitingTime = Date.now() - inWaitingRoomTimestamp;
    debug(
      `We have been waiting for ${Math.round(waitingTime / 1000)} seconds.`
    );
    if (waitingTime > maxWaitingTime) {
      return false;
    }
  }
}

async function acceptNecessaryCookies(page: Page) {
  try {
    await page.click(".cookies-info-close");
    debug("Accepted necessary cookies");
  } catch {}
  await page.waitForTimeout(1000);
}

async function proceedWithACode(page: Page, impfCode: string) {
  debug("Checking with existing code " + impfCode);

  // yes, we have a code
  for (const listElement of await page.$$("span")) {
    const idName = await (
      await listElement.getProperty("innerText")
    )?.jsonValue<string>();
    if (idName && idName.includes("Ja")) {
      await listElement.click({ delay: 200 });
      break;
    }
  }
  await page.waitForTimeout(1000);

  // write code
  await page.type("input[name='ets-input-code-0']", impfCode);

  await page.waitForTimeout(3000);

  // submit
  const submitButton = await page.$("button[type='submit']");
  await submitButton?.click({ delay: 200 });

  await page.waitForNavigation({
    waitUntil: "networkidle0",
  });
  await page.waitForTimeout(3000);

  // inserted a code that has already a booked appointment
  const codeAlreadyInUseHeader = await page.$("h2.ets-booking-headline");
  const codeAlreadyInUseText = await (
    await codeAlreadyInUseHeader?.getProperty("innerText")
  )?.jsonValue<string>();
  if (
    codeAlreadyInUseText &&
    codeAlreadyInUseText.toLowerCase().includes("ihr termin")
  ) {
    debug("There is already a booked appointment with code %s", impfCode);
    return false;
  }

  // search appointment
  const searchButton = await page.$("button.search-filter-button");
  await searchButton?.click({ delay: 500 });
  await page.waitForTimeout(3000);

  // info page
  const appointmentWarning = await page.$(
    "span.its-slot-pair-search-no-results"
  );
  const appointmentText = await (
    await appointmentWarning?.getProperty("innerText")
  )?.jsonValue<string>();

  if (await areWeOffline(page)) {
    debug("We are offline or on some different page");
    return false;
  }

  if (
    !appointmentWarning &&
    appointmentText && (
    !appointmentText.includes("stehen leider keine Termine zur") &&
    !appointmentText.includes("Termine werden gesucht"))
  ) {
    // appointments available!!!
    debug("Appointments available!!");
    debug(appointmentText);
    return true;
  }
  debug("No appointments");
  return false;
}

export async function proceedWithoutACode(page: Page) {
  debug("Checking without a code");
  // no, we have no code
  for (const listElement of await page.$$("span")) {
    const idName = await (
      await listElement.getProperty("innerText")
    )?.jsonValue<string>();
    if (idName && idName.includes("Nein")) {
      await listElement.click({ delay: 200 });
      break;
    }
  }
  debug("Waiting 20s for appointments alert to show");
  await page.waitForTimeout(20000);

  const appointmentWarning = await page.$("div.alert.alert-danger");

  if (await areWeOffline(page)) {
    debug("We are offline or on some different page");
    return false;
  }

  if (!appointmentWarning) {
    // code available
    debug("Appointments available!!");
    return true;
  }
  debug("No appointments");
  return false;
}

async function areWeOffline(page: Page) {
  return !(await page.$("div.footer-copyright"));
}

export async function checkForAppointments(
  page: Page,
  impfLocationUrl: string,
  maxWaitingRoomTimeBeforeRefresh: number,
  impfCode: string | undefined
) {
  do {
    await page.goto(impfLocationUrl);
    debug("Checking impf location " + impfLocationUrl);
  } while (await sitInWaitingRoom(page, maxWaitingRoomTimeBeforeRefresh));

  // cookies - only accept necessary
  await acceptNecessaryCookies(page);

  if (impfCode) {
    return await proceedWithACode(page, impfCode);
  } else {
    return await proceedWithoutACode(page);
  }
}

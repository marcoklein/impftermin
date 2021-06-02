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
  await page.waitForTimeout(2000);

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

  // it is better to determine the appointment availability by actually checking that there is an appointment shown, since from time to time there
  // is no window (with or without available dates) shown at all after hitting the search appointment button. In this case, the previous "if"
  // gives a false positive. When there is a real appointment shown, it always gives dates with a time. Therefore checking for presence of string
  //  "Uhr" seems failsafe, since it does not appear on the 'stuck' search for appointments page

  for (const listElementRealOffer of await page.$$("span")) {
    const elementText = await (
      await listElementRealOffer.getProperty("innerText")
    )?.jsonValue<string>();
    if (elementText && elementText.includes("Uhr")) {
      // appointments available!!!
      debug("Appointments available!!");
      debug("DEBUG: appointmentText=%s", appointmentText);
      return true;
    }
  }
  debug("No appointments");
  debug("DEBUG: appointmentText=%s", appointmentText);
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

export async function bookAppointment(
page: Page, 
title: string,
firstname: string, 
lastname: string, 
zip: string, 
city: string, 
street: string, 
streetnumber: string,
mobile: string,
email: string,
earliestdate: string,
latestdate: string
){
  // Check that all personal data is available
  if (!title || !firstname || !lastname || !zip || !city || !street || !streetnumber || !mobile || !email || !earliestdate || !latestdate) {
	  debug("Personal details incomplete, cannot book appointment.");
	  return false;
  } 
  
 
  var appointmentDates = new Array();
  var dateNumber : number = 0;
  var linearDate : number = 0;
  const desiredEarliestDate : string = earliestdate; // do not book appointment earlier than this date (to book any earliest available set to 01.01.)
  const desiredEarliestLinearDate : number = parseInt(desiredEarliestDate.substring(0,2)) + parseInt(desiredEarliestDate.substring(3,5))*31;
  
  const desiredLatestDate: string = latestdate; // do not book appointment later than this date (to book any available set to 31.12.)
  const desiredLatestLinearDate : number = parseInt(desiredLatestDate.substring(0,2)) + parseInt(desiredLatestDate.substring(3,5))*31;
  var desiredEarliestDateFound : boolean = false;
  
  debug(" ");
  debug("Desired earliest Date %s", desiredEarliestDate);
  debug("Desired latest Date %s", desiredLatestDate);
  debug(" ");
  
  // Get all appointments into array and identify earliest desired date 
  for (const listElementTermin of await page.$$("span")) {
	const idName = await (
      await listElementTermin.getProperty("innerText")
    )?.jsonValue<string>();
	
	// Marker ".," used to find first substring of every date offered
    if (idName && idName.includes(".,") ) {
	  dateNumber++;
	  appointmentDates[dateNumber]=idName;
	  if ( (dateNumber % 2) !== 0 ){
			// every second date is second pair of the two necessary vaccinations
			debug("  ");
			debug("Vacc date pair #%s", ((dateNumber - (dateNumber % 2))/2+1 )); 
			// calculate linear date from day and month (year ignored)
			linearDate = parseInt(idName.substring(5,7)) + parseInt(idName.substring(8,10))*31;			
			if ((linearDate>=desiredEarliestLinearDate) && (linearDate<=desiredLatestLinearDate)){				
				if (!desiredEarliestDateFound){
					debug("This is the earliest Date in desired range: %s", idName);
					// Select desired date by clicking
					await listElementTermin.click({ delay: 200 });
					desiredEarliestDateFound = true;
				}
			}
	  }	  
    }
	// Marker "Uhr" used to find second substring of every date offered
	if (idName && idName.includes("Uhr") ) {
		appointmentDates[dateNumber]=appointmentDates[dateNumber].concat(idName);
		debug("Teiltermin: %s", appointmentDates[dateNumber]);		
	}
  }
  if (!desiredEarliestDateFound){
	  debug("Desired earliest date for first vacc shot not available yet");
	  debug("Latest available date for first shot is %s", appointmentDates[dateNumber-1]);
	
	// Click Abbrechen button to finish and proceed
    for (const listElementTermin of await page.$$("button")) {
	  const idName = await (
		await listElementTermin.getProperty("innerText")
	  )?.jsonValue<string>();
      if (idName && idName.includes("ABBRECHEN")) {
       await listElementTermin.click({ delay: 200 });	  
       break;
      }
    }
    return false;
  }
 
  await page.waitForTimeout(1000);

  // select the desired date
  for (const listElementTermin of await page.$$("button")) {
    const idName = await (
      await listElementTermin.getProperty("innerText")
    )?.jsonValue<string>();
    if (idName && idName.includes("AUSWÄHLEN")) {
      await listElementTermin.click({ delay: 200 });	  
      break;
    }
  }

  // press button and submit selected date to proceed
  const filldataButton = await page.$("button.search-filter-button");
  await filldataButton?.click({ delay: 500 });

  // now fill private data

  // Click Herr, Frau, Divers, Kind
  for (const listElementAnrede of await page.$$("span")) {
    const idName = await (
      await listElementAnrede.getProperty("innerText")
    )?.jsonValue<string>();
    if (idName && idName.includes(title)) {
      await listElementAnrede.click({ delay: 200 });
      break;
    }
  }

  // Firstname
  await page.type("input[name='firstname']", firstname );

  // Lastname
  await page.type("input[name='lastname']", lastname);
 
  // ZIP Code
  await page.type("input[name='plz']", zip);

  // City
  await page.type("input[name='city']", city);
 
  // Street
  await page.type("input[name='street']", street);
 
  // Streetnumber (not obligatory)
  await page.type("input[formcontrolname='housenumber']", streetnumber);

  // Phone
  await page.type("input[name='phone']", mobile);
 
  // Email
  await page.type("input[name='notificationReceiver']", email);

  await page.waitForTimeout(1000);
  
  // Save entered data and proceed
  for (const listElementTermin of await page.$$("button")) {
    const idName = await (
      await listElementTermin.getProperty("innerText")
    )?.jsonValue<string>();
    if (idName && idName.includes("ÜBERNEHMEN")) {
      await listElementTermin.click({ delay: 200 });
      break;
    }
  } 

  // Final confirmation, BINDING booking!!!
  const bookingButton = await page.$("button.search-filter-button");
  // for debugging, the following button click must be deactivated!!! otherwise a binding appointment will be booked!!!
  // await bookingButton?.click({ delay: 500 });
  
  debug(" ");
  debug("===========================================");
  debug("===========================================");
  debug("===== Appointment has been booked :-P =====");
  debug("===========================================");
  debug("===========================================");
  debug(" ");
		
  // Show booked appointment date in debug log
  let i=0;
  for (const listElementBookedTermin of await page.$$("span")) {	  
    const idName = await (
      await listElementBookedTermin.getProperty("innerText")
    )?.jsonValue<string>();
    if (idName && idName.includes("Uhr")) {
		i++;
		if (i>2) {
			break;
		} else {
			debug("%s. vaccination",i);
			debug("Selected Appointment: %s",idName);
		}		
    }
  }
  return true;
}
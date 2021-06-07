import { Page } from "puppeteer-core";
import Debug from "debug";
import { QueueElement } from "./configuration";
const debug = Debug("impftermin:booking");
import { coloredError } from "./index";


export async function bookAppointment( page: Page, queueEntry: QueueElement) {

  // Check that all personal data is available
  if (!queueEntry.title || !queueEntry.firstname || !queueEntry.lastname || !queueEntry.zip || !queueEntry.city || !queueEntry.street || !queueEntry.streetnumber || !queueEntry.mobile || !queueEntry.email || !queueEntry.earliestdate || !queueEntry.latestdate) {
	  debug("Personal details incomplete, cannot book appointment.");
	  return false;
  } 
  
 
  var appointmentDates = new Array();
  var dateNumber : number = 0;
  var linearDate : number = 0;
  const desiredEarliestDate : string = queueEntry.earliestdate; // do not book appointment earlier than this date (to book any earliest available set to 01.01.)
  const desiredEarliestLinearDate : number = parseInt(desiredEarliestDate.substring(0,2)) + parseInt(desiredEarliestDate.substring(3,5))*31;
  
  const desiredLatestDate: string = queueEntry.latestdate; // do not book appointment later than this date (to book any available set to 31.12.)
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
					debug("This is the earliest Date in desired range!");
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
    if (idName && idName.includes(queueEntry.title)) {
      await listElementAnrede.click({ delay: 200 });
      break;
    }
  }

  // Firstname
  await page.type("input[name='firstname']", queueEntry.firstname );

  // Lastname
  await page.type("input[name='lastname']", queueEntry.lastname);
 
  // ZIP Code
  await page.type("input[name='plz']", queueEntry.zip);

  // City
  await page.type("input[name='city']", queueEntry.city);
 
  // Street
  await page.type("input[name='street']", queueEntry.street);
 
  // Streetnumber (not obligatory)
  await page.type("input[formcontrolname='housenumber']", queueEntry.streetnumber);

  // Phone
  await page.type("input[name='phone']", queueEntry.mobile);
 
  // Email
  await page.type("input[name='notificationReceiver']", queueEntry.email);

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
			debug(" ");
		}		
    }
  }
  debug("===========================================");
  return true;
}
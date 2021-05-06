<p>
  <a href="https://github.com/marcoklein/impftermin/releases/latest" alt="Download">
    <img alt="Download latest" src="https://img.shields.io/badge/download-latest-success" />
  </a>
  <a href="https://github.com/marcoklein/impftermin/releases/latest" alt="Download">
    <img alt="Version" src="https://img.shields.io/github/package-json/v/marcoklein/impftermin">
  </a>
</p>

# German Corona Impftermin Helper

Find an Impftermin or Impfcode on [impfterminservice.de](https://www.impfterminservice.de/).

<p align="center">
  <img src="docs/impftermin.gif">
</p>

Automatically checks the website and notifies you about open appointments and available Impf-Codes.
The app opens a Chrome browser and automatically navigates through the page. It beeps if it finds an open slot. You enter personal information and book the appointment manually.

## Run the application without a development environment

If you just want to run the application head over to the [Releases](https://github.com/marcoklein/impftermin/releases) page and download the latest version.
Currently the app is compiled for Windows, macOS and Linux.

Create a new file called `config.json` next to the executable. This is where you define your locations please read the [Configuration](#configuration) section for setup.

After you have created the config.json you can just run the program and wait for your appointment :)

If you have questions, something doesn't work, or you want a new feature then please create a new [issue](https://github.com/marcoklein/impftermin/issues).

## Getting started - for development

You need to install NodeJS in order to run this program:
https://nodejs.org

Then install yarn with

```bash
npm install --global yarn
```

Set up a `config.json` as described in [Configuration](#configuration).

The application also creates an empty config.json when you run it for the first time. Just ensure to properly adjust it, otherwise you get weird errors.

Install dependencies

```bash
yarn
```

Run with

```bash
yarn start
```

The application makes a sound when started. Ensure, that you hear the sound and adjust your sound settings if needed. Impftermin will play that sound if if finds an available slot.

# Project setup

I focused on concise and easy to read code. Comments are in place to improve understanding even though one might argue that comments describing code are not good practice.
You might need to get your head around `async` and `await`.

## Configuration

Impftermin loads the `config.json` from its starting folder. It walks over the defined queue and checks for open appointments for each entry. If you leave the code empty it checks if there are open slots to get a new Impfcode. If you specify a code it will enter the code on the specified location.

Impftermin will walk through the queue and interrupts the app for 25 minutes if it finds an open appointment or an open slot to retrieve a code.

> You need to enter your personal data by your own then!

The intervalInMinutes property defines the timeout between two website checks.

```json
{
  "intervalInMinutes": 15,
  "queue": [
    {
      "url": "https://002-iz.impfterminservice.de/impftermine/service?plz=XXXXX",
      "code": null
    },
    {
      "url": "https://002-iz.impfterminservice.de/impftermine/service?plz=XXXXX",
      "code": "XXXX-XXXX-XXXX"
    }
  ]
}
```

A queue entry defines a `url` and `code`. Get the url by choosing your Impf-Zentrum from https://www.impfterminservice.de/impftermine, press "zum Impfzentrum"...

![](./docs/finding-your-location-url.png)

... and copy that url.

![](./docs/copy-location-url.png)

## Process

The following chart describes how Impftermin will check the site:

![](./docs/process.png)

## Logging

We use [debug](https://www.npmjs.com/package/debug) to print logs.
The application logs with the namespace `impftermin`.

So to include all logs set the DEBUG environment variable to `impftermin:*`.

Logs are enabled by default.

## Environment variables

You may configure a `.env`.
Using Telegram is optional. Check their docs if you want to configure a bot to get notifications about open appointments.

```
TELEGRAM_TOKEN=
TELEGRAM_CHAT_ID=
```

## Dependencies

- [puppeteer](https://www.npmjs.com/package/puppeteer) for browser automation
- [telegraf](https://www.npmjs.com/package/telegraf) for Telegram notification
- [debug](https://www.npmjs.com/package/debug) for logging

For development

- [env-cmd](https://www.npmjs.com/package/env-cmd) to load environment variables
- [release-it](https://www.npmjs.com/package/release-it) for automated GitHub releases
- [pkg](https://www.npmjs.com/package/pkg) to package an application

## Tested on

- Windows 10, Node 14
- Debian 10, Node 14

# Attribution and legal

Due to this project being focused on the German website for vaccination appointments some documentation is written in German.
Docs cover technically concerns mostly in English and sometimes Denglisch.

## Licenses

- [Sound](https://opengameart.org/content/completion-sound) from OpenGameArt.org

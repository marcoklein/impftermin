import * as fs from "fs";
import * as path from "path";
import prompts from "prompts";
import Debug from "debug";
import {
  define,
  assert,
  optional,
  object,
  array,
  string,
  number,
} from "superstruct";
import isUrl from "is-url";
const debug = Debug("impftermin:config");
import { coloredError } from "./index";

export interface Config {
  intervalInMinutes: 15;
  queue: {
    url: string;
    code?: string;
    name?: string;
    title?: string;
    firstname?: string;
    lastname?: string;
    zip?: string;
    city?: string;
    street?: string;
    streetnumber?: string;
    mobile?: string;
    email?: string;
    earliestdate?: string;
    latestdate?: string;
  }[];
}

export interface QueueElement {
  url: string;
  code?: string;
  name?: string;
  title?: string;
  firstname?: string;
  lastname?: string;
  zip?: string;
  city?: string;
  street?: string;
  streetnumber?: string;
  mobile?: string;
  email?: string;
  earliestdate?: string;
  latestdate?: string;
}

const urlValidator = (url: any) => {
  url = String(url);
  return (
    isUrl(url) &&
    new URL(url).host.match("[^.]+\\.impfterminservice\\.de") != null
  );
};

const Url = define("ImpfterminURL", urlValidator);

const Config = object({
  intervalInMinutes: number(),
  queue: array(
    object({
      url: Url,
      code: optional(string()),
      name: optional(string()),
      title: optional(string()),
      firstname: optional(string()),
      lastname: optional(string()),
      zip: optional(string()),
      city: optional(string()),
      street: optional(string()),
      streetnumber: optional(string()),
      mobile: optional(string()),
      email: optional(string()),
      earliestdate: optional(string()),
      latestdate: optional(string()),
    })
  ),
});

const configPaths = [path.join("config.json"), path.join("../config.json")];

const baseConfiguration: Config = {
  intervalInMinutes: 15,
  queue: [
    {
      url: "<Your Impfzentrum Location>",
      code: "Optional Impfcode - remove if you need one first.",
    },
  ],
};

async function askToCreateNewConfig(): Promise<Boolean> {
  const { createNewConfig } = await prompts({
    type: "toggle",
    name: "createNewConfig",
    message:
      "Do you want to create a new configuration file? / Möchtest du eine neue Konfigurationsdatei erstellen?",
    initial: false,
    active: "Yes / Ja",
    inactive: "No / Nein",
  });

  return createNewConfig;
}

async function generateNewConfig(): Promise<Config> {
  debug("So, let's get started with your configuration...");
  debug(
    "Go to https://github.com/marcoklein/impftermin#getting-an-impfzentrum-url for further information"
  );
  debug(
    "Lies dir die Info in https://github.com/marcoklein/impftermin#getting-an-impfzentrum-url durch"
  );

  let configuration = baseConfiguration;
  configuration.queue = [];

  while (true) {
    const { url, anotherUrl, code } = await prompts([
      {
        type: "text",
        name: "url",
        message:
          "Enter an Impf location URL you want to check. / Gib die URL des Impfzentrums ein.",
        validate: urlValidator,
      },
      {
        type: "toggle",
        name: "codeAvailable",
        message:
          "Do you have an Impf code for that location? / Hast du einen Impfcode für dieses Impfzentrum?",
        initial: false,
        active: "Yes / Ja",
        inactive: "No / Nein",
      },
      {
        type: (prev) => (prev ? "text" : null),
        name: "code",
        message: "Your Impf code / Dein Impfcode:",
      },
      {
        type: "toggle",
        name: "anotherUrl",
        message:
          "Do you want to search another location? / Möchtest du ein weiteres Impfzentrum hinzufügen?",
        initial: false,
        active: "Yes / Ja",
        inactive: "No / Nein",
      },
    ]);

    // Exit when aborted
    if (!url) {
      process.exit(1);
    }

    baseConfiguration.queue.push({
      url,
      code,
    });

    if (!anotherUrl) {
      break;
    }
  }

  debug("Storing your config.json for next time...");
  fs.writeFileSync(configPaths[0], JSON.stringify(configuration, undefined, 2));
  debug("Wrote your configuration to %s", configPaths[0]);

  return configuration;
}

export async function loadConfiguration() {
  let configuration: Config | undefined = undefined;

  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) continue;
    try {
      configuration = JSON.parse(fs.readFileSync(configPath).toString("utf-8"));
    } catch (e) {
      debug(coloredError("There are errors in the config.json %s", e));

      if (!(await askToCreateNewConfig())) {
        process.exit(1);
      }

      debug("I am creating a new config.json");
      configuration = await generateNewConfig();
    }
    break;
  }

  if (!configuration) {
    configuration = await generateNewConfig();
  }

  try {
    assert(configuration, Config);
  } catch (e) {
    debug(coloredError("Invalid configuration:", e));
    if (await askToCreateNewConfig()) {
      configuration = await generateNewConfig();
      try {
        assert(configuration, Config);
      } catch (e) {
        debug(coloredError("Invalid configuration:", e));
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }

  debug("Using configuration %O", configuration);
  return configuration;
}

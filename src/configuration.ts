import * as fs from "fs";
import * as path from "path";
import prompts from "prompts";
import Debug from "debug";
const debug = Debug("impftermin:config");

export interface Config {
  intervalInMinutes: 15;
  queue: {
    url: string;
    code?: string;
  }[];
}

export async function loadConfiguration() {
  const baseConfiguration: Config = {
    intervalInMinutes: 15,
    queue: [
      {
        url: "<Your Impfzentrum Location>",
        code: "Optional Impfcode - remove if you need one first.",
      },
    ],
  };
  const configPaths = [path.join("config.json"), path.join("../config.json")];
  let configuration: Config | undefined = undefined;
  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) continue;
    try {
      configuration = JSON.parse(fs.readFileSync(configPath).toString("utf-8"));
    } catch (e) {
      debug("There are errors in the config.json %s", e);
      debug("I am creating a new config.json");
      configuration = undefined;
    }
  }
  if (!configuration) {
    debug("So, let's get started with your configuration...");
    configuration = baseConfiguration;
    configuration.queue = [];

    while (true) {
      const { url, anotherUrl, code } = await prompts([
        {
          type: "text",
          name: "url",
          message:
            "Enter an Impf location URL you want to check. / Gib die URL des Impfzentrums an.",
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

      baseConfiguration.queue.push({
        url,
        code,
      });

      if (!anotherUrl) {
        break;
      }
    }

    debug("Storing your config.json for next time...");
    fs.writeFileSync(
      configPaths[0],
      JSON.stringify(configuration, undefined, 2)
    );
    debug("Wrote your configuration to %s", configPaths[0]);
  }
  debug("Using configuration %O", configuration);
  return configuration;
}

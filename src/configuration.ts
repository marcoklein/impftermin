import * as fs from "fs";
import * as path from "path";
import Debug from "debug";
const debug = Debug("impftermin:config");

export interface Config {
  intervalInMinutes: 15;
  queue: {
    url: string;
    code?: string;
  }[];
}

export function loadConfiguration() {
  const baseConfiguration: Config = {
    intervalInMinutes: 15,
    queue: [
      {
        url: "<Your Impfzentrum Location>",
        code: "Optional Impfcode - remove if you need one first.",
      },
    ],
  };
  const configPaths = [
    path.join(__dirname, "config.json"),
    path.join(__dirname, "../config.json"),
  ];
  let configuration: Config | undefined = undefined;
  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) continue;
    try {
      configuration = JSON.parse(fs.readFileSync(configPath).toString("utf-8"));
    } catch (e) {
      throw new Error(
        "There are errors in your config.json. Please configure it correctly: " +
          e
      );
    }
  }
  if (!configuration) {
    fs.writeFileSync(configPaths[0], JSON.stringify(baseConfiguration));
    throw new Error("Please adjust the config.json");
  }
  debug("Using configuration %O", configuration);
  return configuration;
}

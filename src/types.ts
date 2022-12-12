/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./puppeteer-mods.d.ts" />
// Warn: The above is EXTREMELY important for our custom page mods to be recognized by the end users typescript!

import Server from 'http-proxy';

// Warn: The above is EXTREMELY important for our custom page mods to be recognized by the end users typescript!

export type PortalPluginPageAdditions = {
  getPortalProxy: () => Promise<Server | undefined>;
};
export interface PluginOptions {
  /**
   * Server configs for the webserver hosting the UI that the user accesses to interact with the portal
   */
  webPortalBaseWSPath?: string;
}

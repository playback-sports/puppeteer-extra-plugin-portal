/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./puppeteer-mods.d.ts" />
// Warn: The above is EXTREMELY important for our custom page mods to be recognized by the end users typescript!

import Server from 'http-proxy';

// Warn: The above is EXTREMELY important for our custom page mods to be recognized by the end users typescript!

export type PortalPluginPageAdditions = {
  getPortalProxy: () => Promise<Server | undefined>;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PluginOptions {}

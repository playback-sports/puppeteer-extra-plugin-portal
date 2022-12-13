/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable class-methods-use-this */
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin';
import type { Browser, Page } from 'puppeteer';
import Server, { createProxyServer } from 'http-proxy';
import * as types from './types';

export * from './types';

const getPageTargetId = (page: Page): string => {
  // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-explicit-any
  return (page.target() as any)._targetId;
};

/**
 * A puppeteer-extra plugin to let you interact with headless sessions remotely.
 * @noInheritDoc
 */
export class PuppeteerExtraPluginPortal extends PuppeteerExtraPlugin {
  private targetIdProxyMap: Map<string, Server> = new Map();

  constructor(opts?: Partial<types.PluginOptions>) {
    super(opts);
    this.debug('Initialized', this.opts);
  }

  public get name(): string {
    return 'portal';
  }

  public get defaults(): types.PluginOptions {
    return {};
  }

  public async getPortalProxy(page: Page): Promise<Server | undefined> {
    const targetId = getPageTargetId(page);
    const proxyMiddleware = this.targetIdProxyMap.get(targetId);
    return proxyMiddleware;
  }

  private addCustomMethods(prop: Page) {
    /* eslint-disable no-param-reassign */
    prop.getPortalProxy = async () => this.getPortalProxy(prop);
  }

  async onPageCreated(page: Page): Promise<void> {
    this.addCustomMethods(page);

    const targetId = getPageTargetId(page);
    const browser = page.browser();
    const wsUrl = browser.wsEndpoint();

    const wsProxy = createProxyServer({
      target: wsUrl,
      ws: true,
      changeOrigin: true,
    });
    this.debug('ws proxy created', wsUrl);

    this.targetIdProxyMap.set(targetId, wsProxy);
  }

  /** Add additions to already existing pages  */
  async onBrowser(browser: Browser): Promise<void> {
    const pages = await browser.pages();
    pages.forEach((page) => this.addCustomMethods(page));
  }
}

/** Default export, PuppeteerExtraPluginRecaptcha  */
const defaultExport = (options?: Partial<types.PluginOptions>): PuppeteerExtraPluginPortal => {
  return new PuppeteerExtraPluginPortal(options);
};

export default defaultExport;

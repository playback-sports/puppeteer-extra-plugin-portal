/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable class-methods-use-this */
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin';
import type { Browser, Page } from 'puppeteer';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import urlJoin from 'url-join';
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
  private webPortalBaseWSPath?: string;

  private targetIdProxyMap: Map<string, RequestHandler> = new Map();

  constructor(opts?: Partial<types.PluginOptions>) {
    super(opts);
    this.debug('Initialized', this.opts);
    this.webPortalBaseWSPath = (this.opts as types.PluginOptions).webPortalBaseWSPath;
  }

  public get name(): string {
    return 'portal';
  }

  public get defaults(): types.PluginOptions {
    return {
      webPortalBaseWSPath: '/',
    };
  }

  public async getPortalProxy(page: Page): Promise<RequestHandler | undefined> {
    const targetId = getPageTargetId(page);
    const proxyMiddleware = this.targetIdProxyMap.get(targetId);
    return proxyMiddleware;
  }

  private addCustomMethods(prop: Page) {
    /* eslint-disable no-param-reassign */
    prop.getPortalProxy = async () => this.getPortalProxy(prop);
  }

  async onPageCreated(page: Page): Promise<void> {
    this.debug('onPageCreated', page.url());
    this.addCustomMethods(page);

    const targetId = getPageTargetId(page);
    const browser = page.browser();
    const wsUrl = browser.wsEndpoint();

    const params = {
      wsUrl,
      targetId,
    };

    const proxyURL = urlJoin(
      this.webPortalBaseWSPath ? this.webPortalBaseWSPath : '',
      `/ws/${params.targetId}`
    );
    this.debug('open portal', wsUrl, targetId, proxyURL);
    const wsProxy = createProxyMiddleware(proxyURL, {
      target: params.wsUrl,
      logLevel: this.debug.enabled ? 'debug' : 'silent',
      logProvider: () => {
        const subLogger = this.debug.extend('http-proxy-middleware');
        return {
          log: subLogger,
          debug: subLogger,
          error: subLogger,
          info: subLogger,
          warn: subLogger,
        };
      },
      ws: true,
      changeOrigin: true,
    });
    this.targetIdProxyMap.set(params.targetId, wsProxy);
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

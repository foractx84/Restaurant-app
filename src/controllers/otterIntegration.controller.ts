import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { OTTER } from '@configs/config';
import { buildOtterAuthorizeUrl } from '@/api/otter.api';
import { OtterIntegrationControllerInterface, OtterIntegrationServiceInterface, OtterWebhookEvent } from '@interfaces/otterIntegration.interface';
import { OtterStorefrontServiceInterface } from '@interfaces/otterStorefrontService.interface';
import { computeOtterWebhookHmac, validateOtterWebhookHmac } from '@utils/otterWebhookAuth.util';
import { logger } from '@utils/logger';

class OtterIntegrationController implements OtterIntegrationControllerInterface {
  constructor(
    private readonly otterIntegrationService: OtterIntegrationServiceInterface,
    private readonly otterStorefrontService: OtterStorefrontServiceInterface,
  ) {}

  initWebhook = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf-8') : JSON.stringify(req.body);
      const signature = req.headers['x-hmac-sha256'] as string | undefined;

      if (!OTTER.WEBHOOK_SECRET) {
        logger.error('OTTER_WEBHOOK_SECRET is not configured; rejecting Otter webhook');
        res.status(401).end();
        return;
      }

      if (!validateOtterWebhookHmac(OTTER.WEBHOOK_SECRET, rawBody, signature)) {
        logger.error('Otter webhook signature validation failed', {
          hasSignatureHeader: signature !== undefined,
          receivedSignatureLength: signature?.length ?? 0,
          expectedSignatureLength: computeOtterWebhookHmac(OTTER.WEBHOOK_SECRET, rawBody).length,
          secretConfiguredLength: OTTER.WEBHOOK_SECRET.length,
          receivedHeaderNames: Object.keys(req.headers),
        });
        res.status(401).end();
        return;
      }

      const payload = JSON.parse(rawBody) as OtterWebhookEvent;

      this.otterIntegrationService.handleOtterWebhook(payload).catch(err => {
        logger.error(`Error processing Otter webhook event: ${err}`);
      });

      res.status(200).end();
    } catch (err) {
      logger.error(`Otter webhook error: ${(err as Error).message}`);
      res.status(200).end();
    }
  };

  /**
   * Starts organization onboarding: returns the URL for Otter's consent screen so the Manager
   * frontend can present/redirect to it. Requires an authenticated (staff) session.
   */
  authorize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const state = (req.query.state as string | undefined) || uuidv4();
      res.status(200).json({ authorize_url: buildOtterAuthorizeUrl(state) });
    } catch (err) {
      next(err);
    }
  };

  /**
   * OAuth authorization-code callback for organization onboarding.
   * Query: `code` (required). Optional store selection via `brandId` + `storeId`, or Otter `state`
   * formatted as `brandId:storeId` (used when re-authorizing after the client picks from a multi-store list).
   *
   * When {@link OTTER.MANAGER_FRONTEND_URL} is configured, redirects the browser back into the
   * Settings/Account page rather than rendering raw JSON: `?otterConnected=1` on success, or
   * `?otterSelectStores=<base64url JSON>` when the org has multiple stores and the frontend needs to
   * show a picker (the picker then re-hits `authorize` with `state=brandId:storeId` to complete it).
   */
  oAuthCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = req.query.code as string | undefined;
      const state = req.query.state as string | undefined;
      let brandId = req.query.brandId as string | undefined;
      let storeId = req.query.storeId as string | undefined;

      if (!code) {
        res.status(400).json({ error: 'Missing code parameter' });
        return;
      }

      if ((!brandId || !storeId) && state?.includes(':')) {
        const [stateBrandId, stateStoreId] = state.split(':');
        brandId = brandId || stateBrandId;
        storeId = storeId || stateStoreId;
      }

      const result = await this.otterIntegrationService.handleOAuthWithAuthCode(code, brandId, storeId);

      if (!OTTER.MANAGER_FRONTEND_URL) {
        res.status(200).json(result);
        return;
      }

      if (result.connected) {
        res.redirect(`${OTTER.MANAGER_FRONTEND_URL}/settings/account?otterConnected=1`);
        return;
      }

      const stores = (result.selectableStores ?? []).map(({ brandId: id, brandName, store }) => ({
        brandId: id,
        brandName,
        storeId: store.id,
        storeName: store.name,
      }));
      const encodedStores = Buffer.from(JSON.stringify(stores)).toString('base64url');
      res.redirect(`${OTTER.MANAGER_FRONTEND_URL}/settings/account?otterSelectStores=${encodedStores}`);
    } catch (err) {
      next(err);
    }
  };

  /**
   * On-demand fallback for the webhook trigger: enqueues an Otter menu sync for the authenticated
   * request's restaurant. Requires an authenticated (staff) session.
   */
  triggerMenuSync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID, 10);
      const result = await this.otterIntegrationService.triggerManualMenuSync(restaurantID);
      res.status(202).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Pushes the authenticated request's restaurant's complete current menu to Otter
   * (`POST /v1/menus`). Requires an authenticated (staff) session.
   */
  pushMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID, 10);
      const result = await this.otterIntegrationService.pushMenuToOtter(restaurantID);
      res.status(202).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Current storefront availability for the authenticated request's restaurant. Backs the
   * TapManager pause toggle's initial state, and lets it reflect Otter-initiated pauses on refresh.
   */
  getStorefrontStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID, 10);
      res.status(200).json(await this.otterStorefrontService.getStorefrontStatus(restaurantID));
    } catch (err) {
      next(err);
    }
  };

  /** "Pause in Partner": pauses the storefront locally and notifies Otter. */
  pauseStorefront = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID, 10);
      res.status(200).json(await this.otterStorefrontService.setAvailabilityFromPartner(restaurantID, false));
    } catch (err) {
      next(err);
    }
  };

  /** "Unpause in Partner": reopens the storefront locally and notifies Otter. */
  unpauseStorefront = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID = parseInt(res.locals.restaurantID, 10);
      res.status(200).json(await this.otterStorefrontService.setAvailabilityFromPartner(restaurantID, true));
    } catch (err) {
      next(err);
    }
  };
}

export default OtterIntegrationController;

import OtterIntegrationController from '@/controllers/otterIntegration.controller';
import { OTTER } from '@configs/config';
import { OtterIntegrationServiceInterface } from '@interfaces/otterIntegration.interface';
import { OtterStorefrontServiceInterface } from '@interfaces/otterStorefrontService.interface';
import { computeOtterWebhookHmac } from '@utils/otterWebhookAuth.util';
import { logger } from '@utils/logger';
import { Request, Response } from 'express';

jest.mock('@utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('OtterIntegrationController', () => {
  const mockService: OtterIntegrationServiceInterface = {
    handleOtterWebhook: jest.fn().mockResolvedValue(undefined),
    handleOAuthWithAuthCode: jest.fn(),
    connectStoreWithAuthCode: jest.fn(),
    processOtterMenuSyncJob: jest.fn(),
    syncOtterMenuForRestaurant: jest.fn(),
    triggerManualMenuSync: jest.fn(),
    processOtterMenuSyncScan: jest.fn(),
    pushMenuToOtter: jest.fn(),
  };

  const mockStorefrontService: OtterStorefrontServiceInterface = {
    setAvailabilityFromPartner: jest.fn(),
    getStorefrontStatus: jest.fn(),
    handleStorefrontEvent: jest.fn(),
  };

  let controller: OtterIntegrationController;
  let mReq: Partial<Request>;
  let mRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new OtterIntegrationController(mockService, mockStorefrontService);
    mRes = {
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
      json: jest.fn().mockReturnThis(),
      sendStatus: jest.fn(),
      redirect: jest.fn(),
    };
  });

  describe('authorize', () => {
    it('returns the Otter consent screen URL built from the configured redirect URI and scopes', async () => {
      const originalApplicationId = OTTER.APPLICATION_ID;
      const originalRedirectUri = OTTER.REDIRECT_URI;
      const originalOrgScopes = OTTER.ORG_SCOPES;
      OTTER.APPLICATION_ID = 'test-application-id';
      OTTER.REDIRECT_URI = 'https://api-dev.trytaptab.com/otter/auth/callback';
      OTTER.ORG_SCOPES = 'organization.read organization.service_integration';

      mReq = { query: {} };
      await controller.authorize(mReq as Request, mRes as Response, jest.fn());

      expect(mRes.status).toHaveBeenCalledWith(200);
      const [{ authorize_url: authorizeUrl }] = (mRes.json as jest.Mock).mock.calls[0];
      const redirectUrl = new URL(authorizeUrl);
      expect(redirectUrl.pathname).toBe('/v1/auth/oauth2/authorize');
      expect(redirectUrl.searchParams.get('client_id')).toBe(OTTER.APPLICATION_ID);
      expect(redirectUrl.searchParams.get('redirect_uri')).toBe(OTTER.REDIRECT_URI);
      expect(redirectUrl.searchParams.get('response_type')).toBe('code');
      expect(redirectUrl.searchParams.get('scope')).toBe(OTTER.ORG_SCOPES);
      expect(redirectUrl.searchParams.get('state')).toBeTruthy();

      OTTER.APPLICATION_ID = originalApplicationId;
      OTTER.REDIRECT_URI = originalRedirectUri;
      OTTER.ORG_SCOPES = originalOrgScopes;
    });

    it('passes through a client-supplied state instead of generating one', async () => {
      const originalApplicationId = OTTER.APPLICATION_ID;
      const originalRedirectUri = OTTER.REDIRECT_URI;
      OTTER.APPLICATION_ID = 'test-application-id';
      OTTER.REDIRECT_URI = 'https://api-dev.trytaptab.com/otter/auth/callback';

      mReq = { query: { state: 'brand-1:store-1' } };
      await controller.authorize(mReq as Request, mRes as Response, jest.fn());

      const [{ authorize_url: authorizeUrl }] = (mRes.json as jest.Mock).mock.calls[0];
      const redirectUrl = new URL(authorizeUrl);
      expect(redirectUrl.searchParams.get('state')).toBe('brand-1:store-1');

      OTTER.APPLICATION_ID = originalApplicationId;

      OTTER.REDIRECT_URI = originalRedirectUri;
    });
  });

  describe('initWebhook', () => {
    it('returns 200 and enqueues webhook processing for a valid signature', async () => {
      const payload = { eventId: 'evt-1', eventType: 'menus.publish', metadata: {} };
      const rawBody = JSON.stringify(payload);
      const originalSecret = OTTER.WEBHOOK_SECRET;
      OTTER.WEBHOOK_SECRET = 'controller-secret';

      mReq = {
        body: Buffer.from(rawBody),
        headers: { 'x-hmac-sha256': computeOtterWebhookHmac('controller-secret', rawBody) },
      };

      await controller.initWebhook(mReq as Request, mRes as Response, jest.fn());

      expect(mockService.handleOtterWebhook).toHaveBeenCalledWith(payload);
      expect(mRes.status).toHaveBeenCalledWith(200);

      OTTER.WEBHOOK_SECRET = originalSecret;
    });

    it('returns 401 without processing when signature validation fails', async () => {
      const originalSecret = OTTER.WEBHOOK_SECRET;
      OTTER.WEBHOOK_SECRET = 'controller-secret';

      mReq = {
        body: Buffer.from(JSON.stringify({ eventId: 'evt-1', eventType: 'stores.upsert', metadata: {} })),
        headers: { 'x-hmac-sha256': 'bad-signature' },
      };

      await controller.initWebhook(mReq as Request, mRes as Response, jest.fn());

      expect(mockService.handleOtterWebhook).not.toHaveBeenCalled();
      expect(mRes.status).toHaveBeenCalledWith(401);
      expect(logger.error).toHaveBeenCalledWith('Otter webhook signature validation failed', expect.objectContaining({ hasSignatureHeader: true }));

      OTTER.WEBHOOK_SECRET = originalSecret;
    });
  });

  describe('oAuthCallback', () => {
    it('returns 400 when code is missing', async () => {
      mReq = { query: {} };
      await controller.oAuthCallback(mReq as Request, mRes as Response, jest.fn());
      expect(mRes.status).toHaveBeenCalledWith(400);
      expect(mockService.handleOAuthWithAuthCode).not.toHaveBeenCalled();
    });

    it('reads brandId/storeId from Otter state when query params are absent', async () => {
      (mockService.handleOAuthWithAuthCode as jest.Mock).mockResolvedValue({ connected: true });
      mReq = { query: { code: 'abc', state: 'brand-9:store-9' } };

      await controller.oAuthCallback(mReq as Request, mRes as Response, jest.fn());

      expect(mockService.handleOAuthWithAuthCode).toHaveBeenCalledWith('abc', 'brand-9', 'store-9');
    });

    it('redirects to the manager frontend with otterConnected=1 on a completed connection', async () => {
      const originalFrontendUrl = OTTER.MANAGER_FRONTEND_URL;
      OTTER.MANAGER_FRONTEND_URL = 'https://manager-dev.trytaptab.com';
      (mockService.handleOAuthWithAuthCode as jest.Mock).mockResolvedValue({
        connected: true,
        connection: { restaurantID: 1, otterStoreId: 'store-1', brandId: 'brand-1', storeName: 'Store One' },
      });
      mReq = { query: { code: 'abc', brandId: 'brand-1', storeId: 'store-1' } };

      await controller.oAuthCallback(mReq as Request, mRes as Response, jest.fn());

      expect(mRes.redirect).toHaveBeenCalledWith('https://manager-dev.trytaptab.com/settings/account?otterConnected=1');
      expect(mRes.json).not.toHaveBeenCalled();

      OTTER.MANAGER_FRONTEND_URL = originalFrontendUrl;
    });

    it('redirects to the manager frontend with an encoded store list when multiple stores are returned', async () => {
      const originalFrontendUrl = OTTER.MANAGER_FRONTEND_URL;
      OTTER.MANAGER_FRONTEND_URL = 'https://manager-dev.trytaptab.com';
      (mockService.handleOAuthWithAuthCode as jest.Mock).mockResolvedValue({
        connected: false,
        selectableStores: [
          { brandId: 'brand-1', brandName: 'Brand', store: { id: 'store-1', name: 'Store One' } },
          { brandId: 'brand-1', brandName: 'Brand', store: { id: 'store-2', name: 'Store Two' } },
        ],
      });
      mReq = { query: { code: 'abc' } };

      await controller.oAuthCallback(mReq as Request, mRes as Response, jest.fn());

      const [redirectUrl] = (mRes.redirect as jest.Mock).mock.calls[0];
      const url = new URL(redirectUrl);
      expect(url.origin + url.pathname).toBe('https://manager-dev.trytaptab.com/settings/account');
      const decoded = JSON.parse(Buffer.from(url.searchParams.get('otterSelectStores'), 'base64url').toString('utf-8'));
      expect(decoded).toEqual([
        { brandId: 'brand-1', brandName: 'Brand', storeId: 'store-1', storeName: 'Store One' },
        { brandId: 'brand-1', brandName: 'Brand', storeId: 'store-2', storeName: 'Store Two' },
      ]);

      OTTER.MANAGER_FRONTEND_URL = originalFrontendUrl;
    });

    it('falls back to a raw JSON response when no manager frontend URL is configured', async () => {
      const originalFrontendUrl = OTTER.MANAGER_FRONTEND_URL;
      OTTER.MANAGER_FRONTEND_URL = undefined;
      (mockService.handleOAuthWithAuthCode as jest.Mock).mockResolvedValue({ connected: true });
      mReq = { query: { code: 'abc', brandId: 'brand-1', storeId: 'store-1' } };

      await controller.oAuthCallback(mReq as Request, mRes as Response, jest.fn());

      expect(mRes.redirect).not.toHaveBeenCalled();
      expect(mRes.status).toHaveBeenCalledWith(200);
      expect(mRes.json).toHaveBeenCalledWith({ connected: true });

      OTTER.MANAGER_FRONTEND_URL = originalFrontendUrl;
    });
  });

  describe('triggerMenuSync', () => {
    it('parses restaurantID from res.locals and returns 202 with the service result', async () => {
      (mockService.triggerManualMenuSync as jest.Mock).mockResolvedValue({ enqueued: true });
      mRes.locals = { restaurantID: '42' };

      await controller.triggerMenuSync({} as Request, mRes as Response, jest.fn());

      expect(mockService.triggerManualMenuSync).toHaveBeenCalledWith(42);
      expect(mRes.status).toHaveBeenCalledWith(202);
      expect(mRes.json).toHaveBeenCalledWith({ enqueued: true });
    });

    it('forwards service errors to next', async () => {
      const error = new Error('no connected store');
      (mockService.triggerManualMenuSync as jest.Mock).mockRejectedValue(error);
      mRes.locals = { restaurantID: '42' };
      const next = jest.fn();

      await controller.triggerMenuSync({} as Request, mRes as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('pushMenu', () => {
    it('parses restaurantID from res.locals and returns 202 with the service result', async () => {
      (mockService.pushMenuToOtter as jest.Mock).mockResolvedValue({ jobId: 'job-1', status: 'SUCCESS' });
      mRes.locals = { restaurantID: '42' };

      await controller.pushMenu({} as Request, mRes as Response, jest.fn());

      expect(mockService.pushMenuToOtter).toHaveBeenCalledWith(42);
      expect(mRes.status).toHaveBeenCalledWith(202);
      expect(mRes.json).toHaveBeenCalledWith({ jobId: 'job-1', status: 'SUCCESS' });
    });

    it('forwards service errors to next', async () => {
      const error = new Error('no connected store');
      (mockService.pushMenuToOtter as jest.Mock).mockRejectedValue(error);
      mRes.locals = { restaurantID: '42' };
      const next = jest.fn();

      await controller.pushMenu({} as Request, mRes as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { OTTER } from '@configs/config';
import {
  OtterAuthServiceInterface,
  OtterBrand,
  OtterMenuAsynchronousJob,
  OtterMenus,
  OtterMenusUpsertRequest,
  OtterOrganization,
  OtterOrgStore,
  OtterPaginated,
  OtterStoreConnection,
  OtterTokenResponse,
} from '@interfaces/otter.interface';
import {
  OtterStoreAvailabilityRequest,
  OtterStoreEventResultRequest,
  OtterStoreHoursRequest,
} from '@interfaces/otterStorefront.interface';
import { logger } from '@utils/logger';

const client: AxiosInstance = axios.create({
  baseURL: OTTER.BASE_URL,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});

const jsonClient: AxiosInstance = axios.create({
  baseURL: OTTER.BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(req => {
  logger.debug(`OTTER CLIENT - ${req.method?.toUpperCase()} ${req.url}`);
  return req;
});

client.interceptors.response.use(res => {
  logger.debug(`OTTER CLIENT - ${res.status} ${res.config.url}`);
  return res;
});

jsonClient.interceptors.request.use(req => {
  logger.debug(`OTTER CLIENT - ${req.method?.toUpperCase()} ${req.url}`);
  return req;
});

jsonClient.interceptors.response.use(res => {
  logger.debug(`OTTER CLIENT - ${res.status} ${res.config.url}`);
  return res;
});

export async function fetchOtterToken(): Promise<OtterTokenResponse> {
  try {
    if (!OTTER.APPLICATION_ID || !OTTER.CLIENT_SECRET) {
      throw new Error('OTTER_APPLICATION_ID and OTTER_CLIENT_SECRET must be configured');
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: OTTER.APPLICATION_ID,
      client_secret: OTTER.CLIENT_SECRET,
      scope: OTTER.SCOPES,
    });

    const { data } = (await client.post<OtterTokenResponse>('/v1/auth/token', body.toString())) as AxiosResponse<OtterTokenResponse>;
    return data;
  } catch (error) {
    logger.error('Failed to acquire Otter access token', {
      message: (error as AxiosError).message,
      status: (error as AxiosError).response?.status,
      data: (error as AxiosError).response?.data,
    });
    throw error;
  }
}

/**
 * Builds the URL that starts the OAuth authorization-code flow: the user's browser is sent here to
 * grant consent, then Otter redirects back to `OTTER_REDIRECT_URI` with a `code` (and this `state`).
 *
 * @see https://developer-guides.tryotter.com/api-reference/#operation/authorizeEndpoint
 */
export function buildOtterAuthorizeUrl(state: string): string {
  if (!OTTER.REDIRECT_URI) {
    throw new Error('OTTER_REDIRECT_URI is not configured');
  }
  if (!OTTER.APPLICATION_ID) {
    throw new Error('OTTER_APPLICATION_ID is not configured');
  }

  const url = new URL('/v1/auth/oauth2/authorize', OTTER.BASE_URL);
  url.searchParams.set('client_id', OTTER.APPLICATION_ID);
  url.searchParams.set('redirect_uri', OTTER.REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', OTTER.ORG_SCOPES);
  url.searchParams.set('state', state);
  return url.toString();
}

/**
 * Exchanges an OAuth authorization code for a user access token (organization onboarding).
 * Requires `OTTER_REDIRECT_URI` to match the value registered in the Otter Developer Portal.
 *
 * @see https://developer-guides.tryotter.com/docs/organization-integrations-onboarding-flow/
 */
export async function exchangeOtterAuthCode(code: string): Promise<OtterTokenResponse> {
  try {
    if (!OTTER.REDIRECT_URI) {
      throw new Error('OTTER_REDIRECT_URI is not configured');
    }
    if (!OTTER.APPLICATION_ID || !OTTER.CLIENT_SECRET) {
      throw new Error('OTTER_APPLICATION_ID and OTTER_CLIENT_SECRET must be configured');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: OTTER.APPLICATION_ID,
      client_secret: OTTER.CLIENT_SECRET,
      code,
      redirect_uri: OTTER.REDIRECT_URI,
      scope: OTTER.ORG_SCOPES,
    });

    const { data } = (await client.post<OtterTokenResponse>('/v1/auth/token', body.toString())) as AxiosResponse<OtterTokenResponse>;
    return data;
  } catch (error) {
    logger.error('Failed to exchange Otter authorization code', {
      message: (error as AxiosError).message,
      status: (error as AxiosError).response?.status,
      data: (error as AxiosError).response?.data,
    });
    throw error;
  }
}

export async function getOtterOrganization(accessToken: string): Promise<OtterOrganization> {
  const { data } = await jsonClient.get<OtterOrganization>('/organization/v1/organization', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function listOtterBrands(accessToken: string, limit = 100): Promise<OtterPaginated<OtterBrand>> {
  const { data } = await jsonClient.get<OtterPaginated<OtterBrand>>('/organization/v1/organization/brands', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { limit },
  });
  return data;
}

export async function listOtterStoresForBrand(accessToken: string, brandId: string, limit = 100): Promise<OtterPaginated<OtterOrgStore>> {
  const { data } = await jsonClient.get<OtterPaginated<OtterOrgStore>>(`/organization/v1/organization/brands/${brandId}/stores`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { limit },
  });
  return data;
}

export async function getOtterStore(accessToken: string, brandId: string, storeId: string): Promise<OtterOrgStore> {
  const { data } = await jsonClient.get<OtterOrgStore>(`/organization/v1/organization/brands/${brandId}/stores/${storeId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function getOtterStoreConnection(accessToken: string, brandId: string, storeId: string): Promise<OtterStoreConnection | null> {
  try {
    const { data } = await jsonClient.get<OtterStoreConnection>(`/organization/v1/organization/brands/${brandId}/stores/${storeId}/connection`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data;
  } catch (error) {
    if ((error as AxiosError).response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createOtterStoreConnection(accessToken: string, brandId: string, storeId: string, partnerStoreId: string): Promise<void> {
  await jsonClient.post(
    `/organization/v1/organization/brands/${brandId}/stores/${storeId}/connection`,
    { storeId: partnerStoreId },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export async function deleteOtterStoreConnection(accessToken: string, brandId: string, storeId: string): Promise<void> {
  await jsonClient.delete(`/organization/v1/organization/brands/${brandId}/stores/${storeId}/connection`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_BACKOFF_MS = 300;

interface OtterRetryableConfig extends InternalAxiosRequestConfig {
  /** Guards the single 401 re-auth retry (Otter has no refresh flow — we re-acquire the app token). */
  _reAuthRetried?: boolean;
  /** Counts transient 5xx retries so backoff can grow and stop at the cap. */
  _serverErrorRetries?: number;
}

export interface CreateOtterClientConfig {
  /** Supplies (and re-acquires) the app-level client-credentials token. */
  authService: OtterAuthServiceInterface;
  /**
   * Partner-assigned external store id for calls that operate on a single store. When set it is sent
   * as `X-Store-Id` on every request, mirroring how Otter matches a store to the partner application.
   */
  storeId?: string;
  /** Transient-5xx retry tuning. Defaults: 3 retries, 300ms base with exponential backoff. */
  retry?: { maxRetries?: number; baseBackoffMs?: number };
}

/**
 * Builds an authenticated Otter API client. Unlike the token-passing helpers above, this client
 * attaches auth and store context automatically via interceptors and adds resilience:
 * - Request: sets `Authorization` from {@link OtterAuthServiceInterface.getValidAccessToken}, the
 *   `X-Application-Id`, and (when provided) `X-Store-Id`.
 * - Response: retries transient 5xx errors with exponential backoff, and on a 401 re-acquires the
 *   app token once and retries (Otter issues client-credentials tokens, so there is no refresh flow
 *   to fall back on — we simply obtain a fresh one).
 *
 * Modeled on {@link createCheckmateClient} in `checkmate-auth.api.ts`, simplified for Otter's
 * tokenless per-store model.
 */
export function createOtterClient(config: CreateOtterClientConfig): AxiosInstance {
  const { authService, storeId } = config;
  const maxRetries = config.retry?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseBackoffMs = config.retry?.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS;

  const instance = axios.create({
    baseURL: OTTER.BASE_URL,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use(async (reqConfig: InternalAxiosRequestConfig) => {
    logger.debug(`OTTER CLIENT - ${reqConfig.method?.toUpperCase()} ${reqConfig.url}`);
    reqConfig.headers.Authorization = `Bearer ${await authService.getValidAccessToken()}`;
    if (OTTER.APPLICATION_ID) {
      reqConfig.headers['X-Application-Id'] = OTTER.APPLICATION_ID;
    }
    if (storeId) {
      reqConfig.headers['X-Store-Id'] = storeId;
    }
    return reqConfig;
  });

  instance.interceptors.response.use(
    (res: AxiosResponse) => {
      logger.debug(`OTTER CLIENT - ${res.status} ${res.config.url}`);
      return res;
    },
    async (error: AxiosError) => {
      const original = error.config as OtterRetryableConfig | undefined;
      const status = error.response?.status;

      if (!original) {
        return Promise.reject(enrichOtterError(error));
      }

      // 401: no refresh token for client credentials — force a fresh app token once and retry.
      if (status === 401 && !original._reAuthRetried) {
        original._reAuthRetried = true;
        logger.debug('Otter returned 401; re-acquiring app access token and retrying once.');
        const token = await authService.acquireAndStoreToken();
        original.headers.Authorization = `Bearer ${token}`;
        return instance(original);
      }

      // Transient 5xx: retry with exponential backoff up to the cap.
      if (status !== undefined && status >= 500 && status <= 599) {
        original._serverErrorRetries = (original._serverErrorRetries ?? 0) + 1;
        if (original._serverErrorRetries <= maxRetries) {
          const delay = baseBackoffMs * 2 ** (original._serverErrorRetries - 1);
          logger.warn(`Otter request to ${original.url} failed with ${status}; retry ${original._serverErrorRetries}/${maxRetries} in ${delay}ms.`);
          await sleep(delay);
          return instance(original);
        }
      }

      return Promise.reject(enrichOtterError(error));
    },
  );

  return instance;
}

/**
 * Fetches the store's current menu. Requires the `menus.read` scope and an `X-Store-Id`-bound
 * client (i.e. one built via {@link createOtterClient} with `storeId` set).
 *
 * @see https://developer-guides.tryotter.com/api-reference/#operation/getMenu
 */
export async function fetchOtterMenu(client: AxiosInstance): Promise<OtterMenus> {
  const { data } = (await client.get<OtterMenus>('/v1/menus')) as AxiosResponse<OtterMenus>;
  return data;
}

/**
 * Pushes TapTab's complete menu state for a store into Otter. Full-replacement semantics: any
 * customer-menu entity omitted from `request` is deleted on Otter's side, so callers must always
 * send the whole desired menu, never a partial diff. Requires the `menus.upsert` scope and an
 * `X-Store-Id`-bound client. Returns immediately with a `PENDING` job; poll {@link getOtterMenuJobStatus}
 * for the terminal `SUCCESS`/`FAILED` result. Rate limit: 2 requests per minute.
 *
 * @see https://connect.tryotter.com/docs/api-reference/reference/upsert-menu/
 */
export async function upsertOtterMenu(client: AxiosInstance, request: OtterMenusUpsertRequest): Promise<OtterMenuAsynchronousJob> {
  const { data } = (await client.post<OtterMenuAsynchronousJob>('/v1/menus', request)) as AxiosResponse<OtterMenuAsynchronousJob>;
  return data;
}

/**
 * Polls the status of an async menu job started by {@link upsertOtterMenu}. Requires the
 * `menus.async_job.read` scope and an `X-Store-Id`-bound client. Rate limit: 8 requests per minute.
 *
 * @see https://connect.tryotter.com/docs/api-reference/reference/get-menu-async-job-status/
 */
export async function getOtterMenuJobStatus(client: AxiosInstance, jobId: string): Promise<OtterMenuAsynchronousJob> {
  const { data } = (await client.get<OtterMenuAsynchronousJob>(`/v1/menus/jobs/${jobId}`)) as AxiosResponse<OtterMenuAsynchronousJob>;
  return data;
}

/**
 * Notifies Otter that a store's availability changed, and doubles as the answer to Otter's
 * get-availability webhook. Both directions use this one endpoint (confirmed by Otter API Support).
 * Requires an `X-Store-Id`-bound client. Rate limit: 16 requests per minute. Returns 204.
 *
 * `eventId` becomes the `X-Event-Id` header, which the endpoint lists as OPTIONAL: echo the inbound
 * webhook's event id when answering a request from Otter, and pass `undefined` for a
 * partner-initiated pause/unpause, which corresponds to no event of Otter's. Don't invent one.
 *
 * The body is flat — `storeState`, `statusChangedAt`, `eventResultMetadata` as siblings — and
 * `storeState` must be one of the values in {@link OTTER_STORE_STATE}. An unlisted value fails
 * deserialization of the whole body, which Otter reports as
 * `400 Successful event result with storeState and statusChangedAt equal to null` rather than as a
 * field-level enum error. That message names the two fields whatever the actual cause; read it as
 * "this body did not parse", not "these two fields were missing".
 *
 * @see https://connect.tryotter.com/docs/api-reference/reference/post-store-availability-change/
 */
export async function notifyOtterStoreAvailability(
  client: AxiosInstance,
  eventId: string | undefined,
  request: OtterStoreAvailabilityRequest,
): Promise<void> {
  await client.post('/v1/storefront/availability', request, eventId ? { headers: { 'X-Event-Id': eventId } } : undefined);
}

/**
 * Reports the store's operating hours to Otter, answering Otter's store-hours webhook. Otter
 * requires this for Storefront to function at all, independent of pause/unpause support.
 * Requires an `X-Store-Id`-bound client. Rate limit: 16 requests per minute. Returns 204.
 *
 * @see https://connect.tryotter.com/docs/api-reference/reference/post-store-hours-configuration-change/
 */
export async function notifyOtterStoreHours(client: AxiosInstance, eventId: string, request: OtterStoreHoursRequest): Promise<void> {
  await client.post('/v1/storefront/hours', request, { headers: { 'X-Event-Id': eventId } });
}

/**
 * Tells Otter whether the pause it requested via the pause-store webhook actually succeeded.
 * `eventId` must echo the originating webhook's event id so Otter can correlate the result.
 * Requires an `X-Store-Id`-bound client. Rate limit: 8 requests per minute. Returns 204.
 *
 * @see https://connect.tryotter.com/docs/api-reference/reference/post-pause-store-event-result/
 */
export async function notifyOtterPauseResult(client: AxiosInstance, eventId: string, request: OtterStoreEventResultRequest): Promise<void> {
  await client.post('/v1/storefront/pause', request, { headers: { 'X-Event-Id': eventId } });
}

/**
 * Unpause counterpart of {@link notifyOtterPauseResult}.
 * Requires an `X-Store-Id`-bound client. Rate limit: 8 requests per minute. Returns 204.
 *
 * @see https://connect.tryotter.com/docs/api-reference/reference/post-unpause-store-event-result/
 */
export async function notifyOtterUnpauseResult(client: AxiosInstance, eventId: string, request: OtterStoreEventResultRequest): Promise<void> {
  await client.post('/v1/storefront/unpause', request, { headers: { 'X-Event-Id': eventId } });
}

/** A menu upsert payload can run to megabytes; cap what a single failure puts in the log. */
const MAX_LOGGED_REQUEST_BODY_LENGTH = 2000;

function enrichOtterError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    return new Error(
      `Otter API error: ${error.response?.status} | URL: ${error.config?.url} | Sent: ${summarizeRequestBody(error.config?.data)} | Body: ${JSON.stringify(
        error.response?.data,
      )}`,
    );
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * The request body as it actually went over the wire. Axios has already run `transformRequest` by
 * the time an error reaches the response interceptor, so `config.data` is normally the serialized
 * string — which is the point: it distinguishes "we sent the wrong shape" from "we sent nothing".
 *
 * Safe to log: Otter carries auth in headers, and the only credential-bearing call
 * ({@link fetchOtterToken}) uses a different client that never reaches this handler.
 */
function summarizeRequestBody(data: unknown): string {
  if (data === undefined || data === null) {
    return '<empty>';
  }
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  return serialized.length > MAX_LOGGED_REQUEST_BODY_LENGTH ? `${serialized.slice(0, MAX_LOGGED_REQUEST_BODY_LENGTH)}...<truncated>` : serialized;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

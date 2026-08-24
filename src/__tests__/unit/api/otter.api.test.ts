import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { createOtterClient } from '@/api/otter.api';
import { OTTER } from '@configs/config';
import { OtterAuthServiceInterface } from '@interfaces/otter.interface';

jest.mock('@utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const okResponse = (config: InternalAxiosRequestConfig, status = 200): AxiosResponse => ({
  data: { ok: true },
  status,
  statusText: 'OK',
  headers: {},
  config,
});

const axiosError = (status: number, config: InternalAxiosRequestConfig): AxiosError => {
  const err = new Error(`Request failed with status code ${status}`) as AxiosError;
  err.isAxiosError = true;
  err.config = config;
  err.response = { status, data: { message: 'boom' }, statusText: '', headers: {}, config } as AxiosResponse;
  return err;
};

describe('createOtterClient', () => {
  let authService: OtterAuthServiceInterface;
  let currentToken: string;
  const originalApplicationId = OTTER.APPLICATION_ID;

  beforeEach(() => {
    OTTER.APPLICATION_ID = 'app-123';
    currentToken = 'valid-token';
    authService = {
      getValidAccessToken: jest.fn(async () => currentToken),
      // Mirrors reality: re-acquiring persists a fresh token that getValidAccessToken then returns.
      acquireAndStoreToken: jest.fn(async () => {
        currentToken = 'fresh-token';
        return currentToken;
      }),
    };
  });

  afterEach(() => {
    OTTER.APPLICATION_ID = originalApplicationId;
  });

  it('attaches Authorization, X-Application-Id, and X-Store-Id headers on every request', async () => {
    const client = createOtterClient({ authService, storeId: 'store-42' });
    let seen: InternalAxiosRequestConfig | undefined;
    client.defaults.adapter = async config => {
      seen = config;
      return okResponse(config, 204);
    };

    await client.put('/v1/stores/status', { status: 'ACTIVE' });

    expect(seen?.headers.get('Authorization')).toBe('Bearer valid-token');
    expect(seen?.headers.get('X-Application-Id')).toBe('app-123');
    expect(seen?.headers.get('X-Store-Id')).toBe('store-42');
    expect(authService.getValidAccessToken).toHaveBeenCalledTimes(1);
  });

  it('omits X-Store-Id when no store context is supplied', async () => {
    const client = createOtterClient({ authService });
    let seen: InternalAxiosRequestConfig | undefined;
    client.defaults.adapter = async config => {
      seen = config;
      return okResponse(config);
    };

    await client.post('/v1/stores', { success: true, storeId: '42' });

    expect(seen?.headers.get('X-Store-Id')).toBeFalsy();
  });

  it('retries transient 5xx errors with backoff and eventually succeeds', async () => {
    const client = createOtterClient({ authService, retry: { maxRetries: 3, baseBackoffMs: 0 } });
    let calls = 0;
    client.defaults.adapter = async config => {
      calls += 1;
      if (calls < 3) {
        return Promise.reject(axiosError(503, config));
      }
      return okResponse(config);
    };

    const res = await client.post('/v1/stores', {});

    expect(calls).toBe(3);
    expect(res.status).toBe(200);
  });

  it('gives up after the retry cap and rejects with an enriched error', async () => {
    const client = createOtterClient({ authService, retry: { maxRetries: 2, baseBackoffMs: 0 } });
    let calls = 0;
    client.defaults.adapter = async config => {
      calls += 1;
      return Promise.reject(axiosError(500, config));
    };

    await expect(client.post('/v1/stores', {})).rejects.toThrow(/Otter API error: 500/);
    // initial attempt + 2 retries
    expect(calls).toBe(3);
  });

  it('does not retry client (4xx) errors other than 401', async () => {
    const client = createOtterClient({ authService, retry: { maxRetries: 3, baseBackoffMs: 0 } });
    let calls = 0;
    client.defaults.adapter = async config => {
      calls += 1;
      return Promise.reject(axiosError(400, config));
    };

    await expect(client.post('/v1/stores', {})).rejects.toThrow(/Otter API error: 400/);
    expect(calls).toBe(1);
  });

  it('re-acquires the app token once on a 401 and retries', async () => {
    const client = createOtterClient({ authService, retry: { maxRetries: 3, baseBackoffMs: 0 } });
    let calls = 0;
    let retriedAuth: string | undefined;
    client.defaults.adapter = async config => {
      calls += 1;
      if (calls === 1) {
        return Promise.reject(axiosError(401, config));
      }
      retriedAuth = String(config.headers.get('Authorization'));
      return okResponse(config);
    };

    const res = await client.get('/v1/stores');

    expect(res.status).toBe(200);
    expect(authService.acquireAndStoreToken).toHaveBeenCalledTimes(1);
    expect(retriedAuth).toBe('Bearer fresh-token');
    expect(calls).toBe(2);
  });

  it('does not loop on repeated 401s (re-auth is attempted at most once)', async () => {
    const client = createOtterClient({ authService, retry: { maxRetries: 3, baseBackoffMs: 0 } });
    let calls = 0;
    client.defaults.adapter = async config => {
      calls += 1;
      return Promise.reject(axiosError(401, config));
    };

    await expect(client.get('/v1/stores')).rejects.toThrow(/Otter API error: 401/);
    // initial attempt + one re-auth retry
    expect(calls).toBe(2);
    expect(authService.acquireAndStoreToken).toHaveBeenCalledTimes(1);
  });
});

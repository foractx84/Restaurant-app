import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import TokenStore from './token-store.api';
import { getRefreshToken } from '@/api/checkmate.api';
import { GetAccessTokenResponse } from '@interfaces/checkmate.interface';
import { PlatformIntegrationEntity } from '@entities/platformIntegration.entity';
import { CHECKMATE } from '@configs/config';
import { logger } from '@utils/logger';

interface QueueEntry {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const createCheckmateClient = (config: { locationID: number; tokenStore: TokenStore }): AxiosInstance => {
  logger.debug(`Initiating creation of Checkmate Axios Client.`);
  const { locationID, tokenStore } = config;

  let isRefreshing = false;
  let queue: QueueEntry[] = [];

  const drainQueue = (error: unknown, token: string | null): void => {
    for (const entry of queue) {
      error ? entry.reject(error) : entry.resolve(token!);
    }
    queue = [];
  };

  const doRefresh = async (): Promise<string> => {
    const refreshToken = await tokenStore.getRefreshToken();
    if (!refreshToken) {
      throw new Error(`No refresh token for location ${locationID} — re-authentication required.`);
    }

    logger.debug(`Refresh token found for location ${locationID}.`);

    const lock = await tokenStore.acquireAdvisoryLock();

    try {
      if (!lock.acquired) {
        logger.debug(`No existing advisory lock for location ${locationID} and platform checkmate.`);
        await sleep(2000);
        tokenStore.bustCache();
        const freshToken = await tokenStore.getAccessToken();
        if (!freshToken) throw new Error(`Token unavailable after waiting for lock: location ${locationID}  and platform checkmate.`);
        return freshToken;
      }

      tokenStore.bustCache();
      if (!(await tokenStore.isExpiredOrStale())) {
        logger.debug(`Token has already been updated, returning new access token.`);
        return (await tokenStore.getAccessToken())!;
      }

      const integration: PlatformIntegrationEntity = await tokenStore.getPlatformIntegration();
      if (!integration?.accessToken) throw new Error(`Token unavailable after waiting for lock: location ${locationID}`);

      const data: GetAccessTokenResponse = await getRefreshToken(refreshToken);
      await tokenStore.set({
        integration,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      });

      logger.debug(`Successfully refreshed authentication tokens and persisted. Returning new access token.`);
      return data.access_token;
    } catch (error) {
      throw error;
    } finally {
      await lock.release();
    }
  };

  const getOrRefreshToken = async (): Promise<string> => {
    if (isRefreshing) {
      logger.debug(`Refresh attempt occurred while refresh is taking place for location: ${locationID}`);
      return new Promise<string>((resolve, reject) => {
        queue.push({ resolve, reject });
      });
    }

    isRefreshing = true;
    try {
      const token = await doRefresh();
      drainQueue(null, token);
      return token;
    } catch (err) {
      drainQueue(err, null);
      throw err;
    } finally {
      isRefreshing = false;
    }
  };

  const client: AxiosInstance = axios.create({
    baseURL: `https://${CHECKMATE.HOSTNAME}`,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (reqConfig: InternalAxiosRequestConfig) => {
    logger.debug(`CHECKMATE CLIENT - ${reqConfig.method?.toUpperCase()} ${reqConfig.url}`, { data: reqConfig.data });
    if (await tokenStore.isExpiredOrStale()) {
      logger.debug(`Access token is expired. Initiating token refresh.`);
      reqConfig.headers.Authorization = `Bearer ${await getOrRefreshToken()}`;
    } else {
      logger.debug(`Fetching Access token to add to request.`);
      reqConfig.headers.Authorization = `Bearer ${await tokenStore.getAccessToken()}`;
    }
    return reqConfig;
  });

  client.interceptors.response.use(
    response => {
      logger.debug(`VANILLA CLIENT - ${response.status} ${response.config.url}`, { data: response.data });
      return response;
    },
    async error => {
      logger.debug(`VANILLA CLIENT - ${error.response.status} ${error.response.config.url}`, { data: error.response.data });
      const originalReq = error.config as RetryableConfig;

      if (error.response?.status !== 401 || originalReq._retry) {
        return Promise.reject(enrichError(error));
      }

      originalReq._retry = true;
      tokenStore.bustCache();

      try {
        originalReq.headers.Authorization = `Bearer ${await getOrRefreshToken()}`;
        return client(originalReq);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    },
  );

  return client;
};

const enrichError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    return new Error(`Third-party API error: ${error.response?.status} | URL: ${error.config?.url} | Body: ${JSON.stringify(error.response?.data)}`);
  }
  return error instanceof Error ? error : new Error(String(error));
};

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

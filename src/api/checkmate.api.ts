import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { CHECKMATE } from '@configs/config';
import { CheckmateMenu, GetAccessTokenResponse, GetLocationResponse } from '@interfaces/checkmate.interface';
import { logger } from '@utils/logger';

const client: AxiosInstance = axios.create({
  baseURL: `https://${CHECKMATE.HOSTNAME}`,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(req => {
  logger.debug(`VANILLA CLIENT - ${req.method?.toUpperCase()} ${req.url}`, { data: req.data });
  return req;
});

client.interceptors.response.use(res => {
  logger.debug(`VANILLA CLIENT - ${res.status} ${res.config.url}`, { data: res.data });
  return res;
});

export async function getAccessToken(code: string): Promise<GetAccessTokenResponse> {
  const { data } = (await client.post<GetAccessTokenResponse>('/oauth/token', {
    grant_type: 'authorization_code',
    redirect_uri: CHECKMATE.REDIRECT_URI,
    code,
    client_id: CHECKMATE.CLIENT_ID,
    client_secret: CHECKMATE.SECRET,
  })) as AxiosResponse<GetAccessTokenResponse>;
  return data;
}

export async function getRefreshToken(token: string): Promise<GetAccessTokenResponse> {
  try {
    const { data } = (await client.post<GetAccessTokenResponse>('/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: token,
      client_id: CHECKMATE.CLIENT_ID,
      client_secret: CHECKMATE.SECRET,
    })) as AxiosResponse<GetAccessTokenResponse>;
    return data;
  } catch (error) {
    logger.error(`Failed to refresh token`, {
      message: (error as AxiosError).message,
      status: (error as AxiosError).response?.status,
      data: (error as AxiosError).response?.data,
    });
    throw error;
  }
}

export async function getLocation(accessToken: string): Promise<GetLocationResponse> {
  const { data } = (await client.get<GetLocationResponse>('/api/v2/get_location', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })) as AxiosResponse<GetLocationResponse>;
  return data;
}

export async function activateLocation(accessToken: string): Promise<void> {
  await client.get('/api/v2/activate', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function getMenu(managedClient: AxiosInstance, locationID: number, orderSource = 'online'): Promise<CheckmateMenu[]> {
  const { data } = (await managedClient.get<CheckmateMenu[]>(`/api/v2/menu/${orderSource}`, {
    params: { location_id: locationID },
  })) as AxiosResponse<CheckmateMenu[]>;
  return data;
}

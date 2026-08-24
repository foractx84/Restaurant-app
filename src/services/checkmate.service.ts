import { CheckmateMenu, CheckmateServiceInterface, GetAccessTokenResponse, GetLocationResponse } from '@interfaces/checkmate.interface';
import { activateLocation, getAccessToken, getLocation, getMenu } from '@/api/checkmate.api';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { AxiosInstance } from 'axios';

class CheckmateService implements CheckmateServiceInterface {
  activateLocation = async (accessToken: string): Promise<void> => {
    try {
      await activateLocation(accessToken);
    } catch (err) {
      logger.error(`Error occurred while activation location in checkmate. - ${err}`);
      throw new HttpException(
        502,
        getErrorPayload(InternalErrorCode.badGateway, `Error occurred while activation location in checkmate. Refer to logs for more info.`),
      );
    }
  };

  fetchAccessCode = async (authCode: string): Promise<GetAccessTokenResponse> => {
    try {
      // get access code from checkmate
      return await getAccessToken(authCode);
    } catch (err) {
      logger.error(`Error occurred while fetching access token from checkmate. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while fetching access token from checkmate. Refer to logs for more info.`),
      );
    }
  };

  fetchLocationInfo = async (accessToken: string): Promise<GetLocationResponse> => {
    try {
      return await getLocation(accessToken);
    } catch (err) {
      logger.error(`Error occurred while fetching location info from checkmate. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while fetching location info from checkmate. Refer to logs for more info.`),
      );
    }
  };

  fetchMenu = async (client: AxiosInstance, locationID: number): Promise<CheckmateMenu[]> => {
    try {
      logger.info(`Fetching menus for checkmate location ${locationID}.`);
      return await getMenu(client, locationID);
    } catch (err) {
      logger.error(`Error occurred while fetching menu from Checkmate. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while fetching menu from Checkmate. Refer to logs for more info.`),
      );
    }
  };
}

export default CheckmateService;

import { JWT } from '@configs/config';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from './logger';
import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenDataInterface } from '@interfaces/auth.interface';

/**
 * Generate a Token and returns to client
 * @param managerID ID verified from database for TapManager users
 * @returns generated JWT
 */
export const generateToken = (managerID: number, superUser = false): TokenDataInterface => {
  const payload = { managerID, superUser };
  const tokenExpiration = JWT.VALIDITY_MS;
  const defaultOptions: SignOptions = {
    algorithm: JWT.ALGORITHM as jwt.Algorithm,
    noTimestamp: false,
    expiresIn: tokenExpiration + `ms`,
  };

  try {
    const token = jwt.sign(payload || {}, JWT.SECRET_KEY, defaultOptions);
    return { token, hasPairings: superUser, hasImageUpload: superUser };
  } catch (error) {
    logger.warn(`JWT didn't generate correctly via generateToken function.`);
    throw new HttpException(500, getErrorPayload(InternalErrorCode.authorizationTokenInvalid));
  }
};

export const generatePermissionsToken = (managerID: number, superUser = false, permissions?: string[]): string => {
  const payload = { managerID, superUser, permissions };
  const tokenExpiration = JWT.VALIDITY_MS;
  const defaultOptions: SignOptions = {
    algorithm: JWT.ALGORITHM as jwt.Algorithm,
    noTimestamp: false,
    expiresIn: tokenExpiration + `ms`,
  };

  try {
    // I'll need to give you the JWT PERMISSIONS key which is different than our JWT.SECRET_KEY for login
    const permissionToken = jwt.sign(payload || {}, JWT.PERMISSIONS, defaultOptions);
    return permissionToken;
  } catch (error) {
    logger.warn(`JWT didn't generate correctly via generateToken function: ${error}`);
    throw new HttpException(500, getErrorPayload(InternalErrorCode.authorizationTokenInvalid));
  }
};

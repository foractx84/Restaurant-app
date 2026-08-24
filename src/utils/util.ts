import { MenuDisclaimer } from '@enums/menuDisclaimer';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';

/**
 * @method isEmpty
 * @param {String | Number | Object} value
 * @returns {Boolean} true & false
 * @description this value is Empty Check
 */
export const isEmpty = (value: string | number | object): boolean => {
  if (value === null) {
    return true;
  } else if (typeof value !== 'number' && value === '') {
    return true;
  } else if (value === 'undefined' || value === undefined) {
    return true;
  }

  return value !== null && typeof value === 'object' && !Object.keys(value).length;
};

/**
 * @method isNumeric
 * @param {String | Number | Object} value
 * @returns {Boolean} true & false
 * @description this value is a number
 */
export const isNumeric = (value: string | number | object): boolean => {
  return typeof value === 'number';
};

/**
 * @method isString
 * @param {String | Number | Object} value
 * @returns {Boolean} true & false
 * @description this value is a string
 */
export const isString = (value: string | number | object): boolean => {
  return typeof value === 'string';
};

export const toTitleCase = (text: string) => {
  return text
    .toLowerCase()
    .split(' ')
    .map(s => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ');
};

/**
 * @method snakeToCamel
 * @param {String} str
 * @returns {String}
 * @description makes string from snake_case to snakeCase
 */
export const snakeToCamel = (str: string) => {
  return str.replace(/([-_](url)*(id)*[a-z]?)/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
};

/**
 * @method camelizeObj
 * @param {Object} obj
 * @returns {Object}
 * @description returns a new object with all snake fields converted to camel, if a field has an array of objects, those will be converted as well
 */
export const camelizeObj = obj => {
  if (typeof obj !== 'object' || obj === null) return obj;
  const newObj = {};
  for (const key of Object.keys(obj)) {
    if (Array.isArray(obj[key])) {
      newObj[snakeToCamel(key)] = obj[key].map(camelizeObj);
    } else {
      newObj[snakeToCamel(key)] = obj[key];
    }
  }
  return newObj;
};

export const validateArrayOfIDs = (array: any) => {
  const throwError = (input: any) => {
    logger.error(`Provided imagesToDelete: ${JSON.stringify(input)} must be an array of numbers.`);
    throw new HttpException(
      400,
      getErrorPayload(
        InternalErrorCode.missingInputOrIncorrectType,
        `Provided imagesToDelete: ${JSON.stringify(input)} must be an array of numbers.`,
      ),
    );
  };
  if (Array.isArray(array)) {
    const isValid = array.every(element => {
      return typeof element === 'number';
    });
    if (!isValid) {
      throwError(array);
    }
  } else {
    throwError(array);
  }
};

// function specialized to handle imagesOrder i.e. [1, 2, filename-1, 5, 4, filename-0, 3]
export const validateImageOrderArray = (array: any) => {
  const throwError = (input: any) => {
    logger.error(
      `Provided array: ${JSON.stringify(
        input,
      )} of strings must consist of ids, "filename-N", or "video-N", where N is index of uploaded image or video i.e.  ["1", "2", "filename-1', "5", "video-N", "4", "filename-0", "3"]`,
    );
    throw new HttpException(
      400,
      getErrorPayload(
        InternalErrorCode.missingInputOrIncorrectType,
        `Provided array: ${JSON.stringify(
          input,
        )} of strings must consist of ids, "filename-N", or "video-N", where N is index of uploaded image or video i.e.  ["1", "2", "filename-1', "5", "video-N", "4", "filename-0", "3"]`,
      ),
    );
  };

  // checks for "filename-N" or "video-N"
  const checkFilenameFormat = (file: string): boolean => {
    return (file.startsWith('filename-') || file.startsWith('video-')) && !isNaN(parseInt(file.split('-')[1]));
  };

  if (Array.isArray(array)) {
    const isValid = array.every(element => {
      return (
        // must be string and either "filename-N" or "video-N" or an id number such as "1", "2", "3", ...
        typeof element === 'string' && (checkFilenameFormat(element) || !isNaN(parseInt(element)))
      );
    });
    if (!isValid) {
      throwError(array);
    }
  } else {
    throwError(array);
  }
};

/**
 * Generate random string with at least 1 number
 * @param {int} length Length of random sting to generate
 * @returns {string} random string
 */
export const generateRandomPassword = (length: number): string => {
  if (!length) return '';
  const x = length;
  let s = '';
  while (s.length < x && x > 0) {
    if (Math.random() < 0.25) {
      // Append number 25% of the characters
      s += Math.floor((Math.random() - 0.01) * 10);
    } else {
      // Append upper or lowercase 50% of the characters
      s += String.fromCharCode(Math.floor(Math.random() * 26) + (Math.random() > 0.5 ? 97 : 65));
    }
  }
  return new RegExp(/\d/g).test(s) ? s : generateRandomPassword(length); // Ensure at least 1 number
};

export const mapPositions = {
  [1]: MenuDisclaimer.top,
  [2]: MenuDisclaimer.bottom,
};

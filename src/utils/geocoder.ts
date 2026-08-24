import { logger } from '@utils/logger';
import NodeGeocoder from 'node-geocoder';

/**
 * Uses node-geocoder package to acquire lat/long from an address string
 * On Geocoder Success: (No need to do suggested address check):
 * - Store the long/lat for the restaurant
 * - Store Address information for restaurant
 * On Geocoder Failure:
 * - Catch failure and continue -> no storing long/lat for the restaurant
 * - Store Address information for restaurant
 * @param {string} address formatted address string `${address1}, ${city}, ${state}, ${zipCode}`
 * @returns {Promise<number[]>} lat and long values stored in array
 */
export const getLatLongGeocoderFromAddress = async (address: string, restaurantID?: number): Promise<number[]> => {
  try {
    const options = {
      provider: 'openstreetmap',
      httpAdapter: 'https',
      headers: {
        'User-Agent': 'TapTab', // I added a user-agent to comply with OSM's requirements
      },
      formatter: null, // returns JSON as default value
    };
    const geocoder = NodeGeocoder(options);
    const jsonResult = await geocoder.geocode(address);
    const { latitude, longitude } = jsonResult[0];
    if (latitude && longitude) {
      return [latitude, longitude];
    }
    return [];
  } catch (err) {
    logger.error(
      `Unexpected error occurred while geocoding provided address: ${address} ${restaurantID ? ', for restaurantID: ' + restaurantID : ''}. ${err}`,
    );
    return [];
  }
};

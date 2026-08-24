import { Day } from '@enums/day';
import { OtterOrgStore, OtterOrgStoreAddress } from '@interfaces/otter.interface';
import { CreateRestaurantRequestInterface } from '@interfaces/restaurants.interface';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_OPEN = '10:00';
const DEFAULT_CLOSE = '23:00';
const DEFAULT_COUNTRY = 'United States';
const DEFAULT_CUISINE_ID = 1;
const PLACEHOLDER_PHONE = '0000000000';

/**
 * Validates an Otter organization-domain store before TapTab restaurant creation.
 *
 * @returns a human-readable reason when the store cannot be onboarded, or `null` when it is valid.
 */
export function validateOtterOrgStore(store: OtterOrgStore): string | null {
  if (!store.id?.trim()) {
    return 'Otter store id is required';
  }

  if (!store.name?.trim()) {
    return 'store name is required';
  }

  const addressLine = store.address?.fullAddress?.trim() || store.address?.addressLines?.[0]?.trim();
  if (!addressLine) {
    return 'store address is required';
  }

  return null;
}

/**
 * Maps an Otter organization store to a TapTab restaurant creation request.
 * Phone/email/cuisine are placeholders for a manager to complete later.
 *
 * Precondition: `store` has passed {@link validateOtterOrgStore}.
 */
export function mapOtterOrgStoreToRestaurant(store: OtterOrgStore): CreateRestaurantRequestInterface {
  const name = store.name.trim();
  const address = store.address;
  const address1 = extractStreetAddress(address)!;

  return {
    name,
    phone: PLACEHOLDER_PHONE,
    email: buildPlaceholderEmail(name),
    cuisineID: DEFAULT_CUISINE_ID,
    address: {
      address1,
      city: address?.city,
      governingDistrict: address?.state,
      postalCode: address?.postalCode,
      // Otter's countryCode is an ISO code (e.g. "US"); checkCountryExistsByName expects the full
      // country name stored in our countries table (e.g. "United States") — they are not
      // interchangeable, so countryCode is intentionally not used here.
      country: DEFAULT_COUNTRY,
    },
    restaurantHours: [{ day: [Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI], start: DEFAULT_OPEN, end: DEFAULT_CLOSE }],
  };
}

/**
 * Otter's `fullAddress` is a fully-formatted string that already embeds city/state/zip/country
 * (e.g. "8080 Figueroa St, Los Angeles, CA 90003, USA"), and `addressLines[0]` is often identical
 * to it rather than a plain street line. Using either verbatim as `address1` duplicates city/state/
 * zip when {@link mapOtterOrgStoreToRestaurant}'s caller later builds a geocoding query as
 * `${address1}, ${city}, ${governingDistrict}, ${postalCode}` (see restaurantAddress.service.ts) —
 * the doubled-up query fails to resolve against the geocoder even for a valid address. Strip the
 * trailing ", {city}..." segment (using the city Otter already supplied separately) so `address1`
 * is just the street line.
 */
function extractStreetAddress(address?: OtterOrgStoreAddress): string | undefined {
  const full = address?.fullAddress?.trim();
  if (!full) {
    return address?.addressLines?.[0]?.trim();
  }

  if (address?.city) {
    const citySuffixIndex = full.toLowerCase().lastIndexOf(`, ${address.city.trim().toLowerCase()}`);
    if (citySuffixIndex > 0) {
      return full.slice(0, citySuffixIndex).trim();
    }
  }

  return full;
}

function buildPlaceholderEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9._%+-@]/g, '');

  return `${slug}${uuidv4()}@taptabapp.com`;
}

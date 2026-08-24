import { Day } from '@enums/day';
import { OtterOrgStore } from '@interfaces/otter.interface';
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
  const address1 = (address?.fullAddress?.trim() || address?.addressLines?.[0]?.trim())!;

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

function buildPlaceholderEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9._%+-@]/g, '');

  return `${slug}${uuidv4()}@taptabapp.com`;
}

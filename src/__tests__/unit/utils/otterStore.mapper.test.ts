import { OtterOrgStore } from '@interfaces/otter.interface';
import { mapOtterOrgStoreToRestaurant, validateOtterOrgStore } from '@utils/otterStore.mapper';

const VALID_STORE: OtterOrgStore = {
  id: '9208071e-5f7a-444a-b3a7-4a57ff3f614e',
  name: 'Test Store',
  address: {
    fullAddress: '123 Sample Street, San Francisco, CA 94103',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94103',
    countryCode: 'US',
  },
};

describe('otterStore.mapper', () => {
  describe('validateOtterOrgStore', () => {
    it('returns null for a valid store', () => {
      expect(validateOtterOrgStore(VALID_STORE)).toBeNull();
    });

    it('requires a name', () => {
      expect(validateOtterOrgStore({ ...VALID_STORE, name: '   ' })).toBe('store name is required');
    });

    it('requires an address', () => {
      expect(validateOtterOrgStore({ ...VALID_STORE, address: undefined })).toBe('store address is required');
    });
  });

  describe('mapOtterOrgStoreToRestaurant', () => {
    it('maps name and structured address fields, stripping city/state/zip out of address1', () => {
      const request = mapOtterOrgStoreToRestaurant(VALID_STORE);
      expect(request.name).toBe('Test Store');
      // address1 must be street-only: the caller later builds a geocoding query as
      // `${address1}, ${city}, ${governingDistrict}, ${postalCode}` — if fullAddress's city/state/zip
      // were left in address1, that query duplicates every component and fails to geocode.
      expect(request.address.address1).toBe('123 Sample Street');
      expect(request.address.city).toBe('San Francisco');
      expect(request.address.governingDistrict).toBe('CA');
      expect(request.address.postalCode).toBe('94103');
    });

    it('strips the city/state/zip/country suffix from a real Otter fullAddress', () => {
      const store: OtterOrgStore = {
        id: '5da436ae-d31b-4304-bb07-b3d22a33cabf',
        name: 'TapTab Test Store 1',
        address: {
          fullAddress: '8080 Figueroa St, Los Angeles, CA 90003, USA',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90003-2721',
          countryCode: null,
          addressLines: ['8080 Figueroa St, Los Angeles, CA 90003, USA', 'US'],
        },
      };

      const request = mapOtterOrgStoreToRestaurant(store);
      expect(request.address.address1).toBe('8080 Figueroa St');
    });

    it('falls back to the full address when city is missing', () => {
      const store: OtterOrgStore = {
        ...VALID_STORE,
        address: { ...VALID_STORE.address, city: undefined },
      };

      const request = mapOtterOrgStoreToRestaurant(store);
      expect(request.address.address1).toBe('123 Sample Street, San Francisco, CA 94103');
    });

    it('falls back to addressLines[0] when fullAddress is missing', () => {
      const store: OtterOrgStore = {
        ...VALID_STORE,
        address: { city: 'San Francisco', addressLines: ['123 Sample Street'] },
      };

      const request = mapOtterOrgStoreToRestaurant(store);
      expect(request.address.address1).toBe('123 Sample Street');
    });

    it('builds a unique placeholder email', () => {
      const a = mapOtterOrgStoreToRestaurant(VALID_STORE);
      const b = mapOtterOrgStoreToRestaurant(VALID_STORE);
      expect(a.email).not.toBe(b.email);
      expect(a.email).toMatch(/@taptabapp\.com$/);
    });
  });
});

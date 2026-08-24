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
    it('maps name and structured address fields', () => {
      const request = mapOtterOrgStoreToRestaurant(VALID_STORE);
      expect(request.name).toBe('Test Store');
      expect(request.address.address1).toBe('123 Sample Street, San Francisco, CA 94103');
      expect(request.address.city).toBe('San Francisco');
      expect(request.address.governingDistrict).toBe('CA');
      expect(request.address.postalCode).toBe('94103');
    });

    it('builds a unique placeholder email', () => {
      const a = mapOtterOrgStoreToRestaurant(VALID_STORE);
      const b = mapOtterOrgStoreToRestaurant(VALID_STORE);
      expect(a.email).not.toBe(b.email);
      expect(a.email).toMatch(/@taptabapp\.com$/);
    });
  });
});

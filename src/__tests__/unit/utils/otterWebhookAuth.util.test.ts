import { computeOtterWebhookHmac, validateOtterWebhookHmac } from '@/utils/otterWebhookAuth.util';

describe('otterWebhookAuth.util', () => {
  const secret = 'test-webhook-secret';
  const payload = JSON.stringify({ eventId: 'evt-1', eventType: 'stores.upsert' });

  describe('computeOtterWebhookHmac', () => {
    it('computes a stable base64 HMAC SHA256 signature', () => {
      const first = computeOtterWebhookHmac(secret, payload);
      const second = computeOtterWebhookHmac(secret, payload);

      expect(first).toBe(second);
      expect(first.length).toBeGreaterThan(0);
    });
  });

  describe('validateOtterWebhookHmac', () => {
    it('returns true for a valid signature', () => {
      const signature = computeOtterWebhookHmac(secret, payload);
      expect(validateOtterWebhookHmac(secret, payload, signature)).toBe(true);
    });

    it('returns false for an invalid signature', () => {
      expect(validateOtterWebhookHmac(secret, payload, 'invalid-signature')).toBe(false);
    });

    it('returns false when signature header is missing', () => {
      expect(validateOtterWebhookHmac(secret, payload, undefined)).toBe(false);
    });
  });
});

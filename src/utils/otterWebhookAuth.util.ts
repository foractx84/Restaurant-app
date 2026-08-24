import crypto from 'crypto';

/**
 * Computes the Otter webhook HMAC-SHA256 signature for a raw request body.
 *
 * Matches Otter's documented algorithm: UTF-8 encode the secret and payload,
 * HMAC-SHA256 digest, then base64-encode and trim the result. Otter sends this
 * value in the `X-HMAC-SHA256` header on every webhook request.
 *
 * @see https://developer-guides.tryotter.com/docs/guides-webhook-authentication/
 *
 * @param webhookSecret - Webhook endpoint secret from Otter Developer Portal / `OTTER_WEBHOOK_SECRET`
 * @param payload - Raw request body string used for signature computation
 * @returns Base64-encoded HMAC-SHA256 signature
 */
export function computeOtterWebhookHmac(webhookSecret: string, payload: string): string {
  const webhookSecretBytes = Buffer.from(webhookSecret, 'utf-8');
  const payloadBytes = Buffer.from(payload, 'utf-8');
  const computedHashBytes = crypto.createHmac('sha256', webhookSecretBytes).update(payloadBytes).digest();
  return computedHashBytes.toString('base64').trim();
}

/**
 * Validates an Otter webhook `X-HMAC-SHA256` header against the raw request body.
 *
 * Uses a timing-safe comparison to avoid leaking timing information about the
 * expected signature. Returns false when the signature header is missing or
 * does not match.
 *
 * @see https://developer-guides.tryotter.com/docs/guides-webhook-authentication/
 *
 * @param webhookSecret - Webhook endpoint secret from Otter Developer Portal / `OTTER_WEBHOOK_SECRET`
 * @param payload - Raw request body string used for signature computation
 * @param hashSignature - Value from the `X-HMAC-SHA256` request header
 * @returns True when the signature is present and valid
 */
export function validateOtterWebhookHmac(webhookSecret: string, payload: string, hashSignature: string | undefined): boolean {
  if (!hashSignature) {
    return false;
  }

  const computedHash = computeOtterWebhookHmac(webhookSecret, payload);
  const expected = Buffer.from(computedHash, 'utf-8');
  const received = Buffer.from(hashSignature.trim(), 'utf-8');

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

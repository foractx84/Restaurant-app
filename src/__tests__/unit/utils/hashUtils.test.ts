import { generateHash } from '@utils/hashUtils';

describe('generateHash', () => {
  it('returns a deterministic SHA-256 hex digest for the same content', () => {
    const content = JSON.stringify({ name: 'Menu', price: 10 });

    const first = generateHash(content);
    const second = generateHash(content);

    expect(first).toEqual(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns a different hash when the content differs', () => {
    const original = JSON.stringify({ name: 'Menu', price: 10 });
    const changed = JSON.stringify({ name: 'Menu', price: 11 });

    expect(generateHash(original)).not.toEqual(generateHash(changed));
  });
});

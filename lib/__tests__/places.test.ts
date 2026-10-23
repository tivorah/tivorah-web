import { test } from 'node:test';
import assert from 'node:assert/strict';
import { browserCountry, countryFlag, fallbackCountry, isAbroad } from '../api/places';

test('the browser region comes from its languages, defaulting to Australia', () => {
  assert.equal(browserCountry(['en-NG', 'en']), 'NG');
  assert.equal(browserCountry(['en', 'fr-ca']), 'CA');
  assert.equal(browserCountry(['en']), 'AU');
  assert.equal(browserCountry([]), 'AU');
});

test('only Australia uses the suburb filters, and has Tivorah payments by default', () => {
  assert.equal(isAbroad('AU'), false);
  assert.equal(isAbroad(''), false);
  assert.equal(isAbroad('ng'), true);
  assert.equal(fallbackCountry('AU').payments, true);
  assert.equal(fallbackCountry('NG').localityLabel, 'LGA');
  assert.equal(fallbackCountry('US').payments, false);
});

test('country codes become flag emoji', () => {
  assert.equal(countryFlag('NG'), '🇳🇬');
  assert.equal(countryFlag('au'), '🇦🇺');
  assert.equal(countryFlag('XYZ'), '');
});

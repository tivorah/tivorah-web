import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canManage, mediaUrl, newHubErrors, newHubFormData, suggestHubUsername, type NewHub } from '../hubs/shared';

const hub = (overrides: Partial<NewHub> = {}): NewHub => ({
  name: 'Adelaide Makers', username: 'adelaide-makers', slogan: ' Make things ', bio: ' We build. ', isPrivate: false,
  interestIds: [3, 3, 5], ruleKeys: ['preset:no_spam'], customRule: ' Be kind ', locality: { suburb: 'Adelaide', state: 'SA', postcode: '5000' },
  avatar: new Blob(['a'], { type: 'image/png' }), banner: null, ...overrides,
});

test('builds the same multipart fields the mobile app sends', () => {
  const form = newHubFormData(hub());
  assert.equal(form.get('slogan'), 'Make things');
  assert.equal(form.get('bio'), 'We build.');
  assert.equal(form.get('isPrivate'), 'false');
  assert.deepEqual(JSON.parse(String(form.get('interestIds'))), [3, 5]);
  assert.deepEqual(JSON.parse(String(form.get('guidelines'))), [{ key: 'preset:no_spam', text: '' }, { key: 'custom', text: 'Be kind' }]);
  assert.equal(form.get('postcode'), '5000');
  assert.ok(form.get('avatar') instanceof Blob);
  assert.equal(form.get('banner'), null);
});

test('leaves an Australia-wide Hub without location fields', () => {
  const form = newHubFormData(hub({ locality: null }));
  assert.equal(form.get('suburb'), null);
});

test('reports each missing requirement', () => {
  assert.deepEqual(newHubErrors(hub()), {});
  const errors = newHubErrors(hub({ avatar: null, name: 'A', username: 'Bad Name', interestIds: [] }));
  assert.deepEqual(Object.keys(errors), ['avatar', 'name', 'username', 'interests']);
  assert.ok(newHubErrors(hub({ interestIds: [1, 2, 3, 4, 5, 6, 7] })).interests);
});

test('suggests a valid username from a Hub name', () => {
  assert.equal(suggestHubUsername('  Café Lovers of Adelaide! '), 'cafe-lovers-of-adelaide');
});

test('only owners and moderators manage a Hub', () => {
  assert.equal(canManage({ isOwner: true } as never), true);
  assert.equal(canManage({ currentUserRole: 'admin' } as never), true);
  assert.equal(canManage({ currentUserRole: 'member' } as never), false);
});

test('reads media stored as a string or an object', () => {
  assert.equal(mediaUrl('https://x.test/a.png'), 'https://x.test/a.png');
  assert.equal(mediaUrl({ url: 'https://x.test/b.png' }), 'https://x.test/b.png');
  assert.equal(mediaUrl(null), null);
});

test('a Hub outside Australia sends its country, without an empty postcode', () => {
  const form = newHubFormData(hub({ locality: { suburb: 'Ikeja', state: 'Lagos', postcode: '', countryCode: 'NG' } }));
  assert.equal(form.get('countryCode'), 'NG');
  assert.equal(form.get('suburb'), 'Ikeja');
  assert.equal(form.get('postcode'), null);
  assert.equal(newHubFormData(hub({ locality: null, countryCode: 'KE' })).get('countryCode'), 'KE');
});

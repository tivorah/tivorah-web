import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creationPayload } from '../create-payload';
test('event draft includes bounded visit inputs and only nonempty FAQ rows', () => {
  const form = new FormData();
  for (const [key,value] of Object.entries({mode:'online',title:'Example event',startsAt:'2030-01-01T10:00:00Z',endsAt:'2030-01-01T11:00:00Z',arrival:'  Doors at 6  ','faq-question-0':'Can I bring a friend?','faq-answer-0':'Each guest needs a ticket.'})) form.set(key,value);
  const result = creationPayload(form,'event',null,['https://example.test/event.jpg'],'retry-key',[{name:'General',priceCents:0,quantity:10,maxTicketsPerBuyer:4}]);
  assert.ok('information' in result);
  assert.deepEqual(result.information,{arrival:'Doors at 6',accessibility:'',agePolicy:'',refundPolicy:'',faqs:[{question:'Can I bring a friend?',answer:'Each guest needs a ticket.'}]});
  assert.equal(result.status,'draft');
});

const lagos = { suburb: 'Ikeja', state: 'Lagos', postcode: '', countryCode: 'NG' };
const venueForm = (extra: Record<string, string> = {}) => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ mode: 'venue', title: 'Lagos meetup', startsAt: '2030-01-01T10:00:00Z', endsAt: '2030-01-01T11:00:00Z', ...extra })) form.set(key, value);
  return form;
};

test('outside Tivorah ticketing, an event sends no tickets and how people get them', () => {
  const result = creationPayload(venueForm({ externalTicketUrl: 'https://tickets.example.test/lagos' }), 'event', lagos, ['https://example.test/e.jpg'], 'key', undefined, { contact: 'both' });
  assert.ok('tickets' in result);
  assert.deepEqual(result.tickets, []);
  assert.equal(result.externalTicketUrl, 'https://tickets.example.test/lagos');
  assert.equal(result.information.ticketContact, 'both');
  assert.equal('capacity' in result, false);
  assert.equal(result.countryCode, 'NG');
});

test('message-only events need no link; link events must have one', () => {
  const message = creationPayload(venueForm(), 'event', lagos, ['https://example.test/e.jpg'], 'key', undefined, { contact: 'message' });
  assert.ok('information' in message);
  assert.equal(message.information.ticketContact, 'message');
  assert.equal('externalTicketUrl' in message, false);
  assert.throws(() => creationPayload(venueForm(), 'event', lagos, ['https://example.test/e.jpg'], 'key', undefined, { contact: 'link' }), /link/);
});

test('Tivorah-ticketed events still need a ticket package', () => {
  assert.throws(() => creationPayload(venueForm(), 'event', { suburb: 'Adelaide', state: 'SA', postcode: '5000', countryCode: 'AU' }, ['https://example.test/e.jpg'], 'key', []), /ticket package/);
});

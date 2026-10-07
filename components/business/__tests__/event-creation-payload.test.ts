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

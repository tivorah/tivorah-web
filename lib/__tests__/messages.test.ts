import { test } from "node:test";
import assert from "node:assert/strict";
import { conversationListPath, inboxSnippet, messageTabFromSearch, messageTabQuery, viewOnceLabel } from "../messages";

test("Messages opens Chats by default and Enquiries from ?tab=enquiries", () => {
  assert.equal(messageTabFromSearch(""), "private");
  assert.equal(messageTabFromSearch("?tab=chats"), "private");
  assert.equal(messageTabFromSearch("?tab=enquiries"), "enquiry");
  assert.equal(messageTabQuery("enquiry"), "?tab=enquiries");
  assert.equal(messageTabQuery("private"), "");
});

test("each tab lists its own conversation kind", () => {
  assert.equal(conversationListPath("private", 0, 10), "/chat/conversations?kind=private&skip=0&take=10");
  assert.equal(conversationListPath("enquiry", 20, 10), "/chat/conversations?kind=enquiry&skip=20&take=10");
  assert.equal(conversationListPath("private", -5, 0), "/chat/conversations?kind=private&skip=0&take=1");
});

test("view-once photos point the recipient to the app and never show on the web", () => {
  assert.equal(viewOnceLabel({ viewOnce: false }, false), null);
  assert.equal(viewOnceLabel({ viewOnce: true }, false), "View once photo — open it in the Tivorah app");
  assert.equal(viewOnceLabel({ viewOnce: true, viewOnceOpenedAt: "2026-10-29T00:00:00Z" }, false), "View once photo · Opened");
  assert.equal(viewOnceLabel({ viewOnce: true }, true), "View once photo");
});

test("inbox snippets describe messages without text", () => {
  assert.equal(inboxSnippet({ content: " Hello " }), "Hello");
  assert.equal(inboxSnippet({ content: null, viewOnce: true }), "View once photo");
  assert.equal(inboxSnippet({ content: "", type: "image" }), "Photo");
  assert.equal(inboxSnippet({ content: null, attachments: [{}] }), "Photo");
  assert.equal(inboxSnippet({ content: null, type: "audio" }), "Voice message");
  assert.equal(inboxSnippet(null), "Open conversation");
});

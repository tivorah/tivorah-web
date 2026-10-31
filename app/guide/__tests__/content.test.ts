import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { faqs, groups, topics } from "../content";

const allText = JSON.stringify({ topics, faqs, groups });

describe("Tivorah guide content", () => {
  it("lists every topic exactly once and only in a known group", () => {
    const ids = topics.map((topic) => topic.id);
    assert.equal(new Set(ids).size, ids.length, "topic ids are unique");
    const grouped = groups.flatMap((group) => group.topics);
    assert.deepEqual([...grouped].sort(), [...ids].sort(), "each topic belongs to exactly one group");
  });

  it("keeps anchors unique across groups, topics and questions", () => {
    const anchors = [...groups.map((g) => g.id), ...topics.map((t) => t.id), ...faqs.map((f) => f.id), "start-here", "more-help", "guide-top", "common-questions"];
    assert.equal(new Set(anchors).size, anchors.length);
  });

  it("gives each topic a summary, short numbered steps and a tip", () => {
    for (const topic of topics) {
      assert.ok(topic.summary.trim(), `${topic.id} has a summary`);
      assert.ok(topic.steps.length >= 2 && topic.steps.length <= 6, `${topic.id} has 2–6 steps`);
      assert.ok(topic.tip.trim(), `${topic.id} has a tip`);
    }
  });

  it("never claims private chats are end-to-end encrypted or uses internal terms", () => {
    assert.doesNotMatch(allText, /end[- ]to[- ]end|encrypt/i);
    assert.doesNotMatch(allText, /feature flag|\bAPI\b/);
  });
});

import assert from "node:assert/strict";
import test from "node:test";
import { firstFrame } from "../video-frame";

test("asks for a frame just after the start, keeping signed links and existing fragments", () => {
  assert.equal(firstFrame("https://media.example/v.mp4?X-Amz-Signature=abc"), "https://media.example/v.mp4?X-Amz-Signature=abc#t=0.1");
  assert.equal(firstFrame("https://media.example/v.mp4#t=4"), "https://media.example/v.mp4#t=4");
});

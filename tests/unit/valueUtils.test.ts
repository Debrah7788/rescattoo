import test from "node:test";
import assert from "node:assert/strict";
import { formatCurrency, parseCookieHeader } from "../../src/utils/valueUtils.js";

test("parseCookieHeader handles missing headers, empty values, and encoded values", () => {
  assert.deepEqual(parseCookieHeader(), {});
  assert.deepEqual(parseCookieHeader(""), {});
  assert.deepEqual(parseCookieHeader("session=abc%20123; theme=; flag"), {
    session: "abc 123",
    theme: ""
  });
});

test("parseCookieHeader surfaces malformed percent encoding", () => {
  assert.throws(() => parseCookieHeader("session=%E0%A4%A"), URIError);
});

test("formatCurrency formats valid values and rejects non-finite numbers", () => {
  assert.equal(formatCurrency(12.5), "R$ 12,50");
  assert.throws(() => formatCurrency(Number.NaN), RangeError);
});

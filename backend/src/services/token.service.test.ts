import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clearSessionCookieOptions,
  createSessionToken,
  sessionCookie,
  verifySessionToken,
} from "./token.service.js";

test("session token is signed and scoped to the authenticated user", () => {
  const token = createSessionToken({ sub: "507f1f77bcf86cd799439011", role: "agency" });
  const payload = verifySessionToken(token);
  assert.equal(payload.sub, "507f1f77bcf86cd799439011");
  assert.equal(payload.role, "agency");
});

test("session cookie is HTTP-only and can be cleared with matching scope", () => {
  assert.equal(sessionCookie.options.httpOnly, true);
  assert.equal(sessionCookie.options.sameSite, "lax");
  assert.equal(clearSessionCookieOptions.path, sessionCookie.options.path);
  assert.equal(clearSessionCookieOptions.sameSite, sessionCookie.options.sameSite);
});

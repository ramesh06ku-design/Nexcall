import assert from "node:assert/strict";
import { test } from "node:test";
import { UserModel } from "./User.js";

test("User JSON serialization never exposes passwordHash", () => {
  const user = new UserModel({
    name: "Safe User",
    email: "safe@example.com",
    passwordHash: "should-never-leave-the-server",
    role: "agency",
    agencyId: null,
    status: "active",
  });
  const serialized = user.toJSON() as Record<string, unknown>;
  assert.equal("passwordHash" in serialized, false);
  assert.equal(serialized.email, "safe@example.com");
});

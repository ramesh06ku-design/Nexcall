import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { app } from "./app.js";

let server: Server;
let origin: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Test server did not bind");
      origin = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("health endpoint responds without a database connection", async () => {
  const response = await fetch(`${origin}/api/health`);
  const payload = (await response.json()) as { success: boolean };
  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
});

test("current user endpoint rejects unauthenticated requests", async () => {
  const response = await fetch(`${origin}/api/auth/me`);
  assert.equal(response.status, 401);
});

test("role-protected APIs reject unauthenticated requests", async () => {
  for (const path of ["/api/admin", "/api/agency", "/api/worker"]) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 401, path);
  }
});

test("login endpoints are separated and validate their own request shapes", async () => {
  const agencyLogin = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: "worker", password: "password123" }),
  });
  const workerLogin = await fetch(`${origin}/api/auth/worker-login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "owner@example.com", password: "password123" }),
  });
  assert.equal(agencyLogin.status, 400);
  assert.equal(workerLogin.status, 400);
});

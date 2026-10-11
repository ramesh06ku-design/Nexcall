import assert from "node:assert/strict";
import { test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import { authorize } from "./authorize.js";
import { AppError } from "../utils/AppError.js";
import type { SafeUser, UserRole } from "../types/domain.js";

function requestFor(role?: UserRole) {
  const request = {} as Request;
  if (role) {
    request.user = {
      id: "507f1f77bcf86cd799439011",
      name: "Test User",
      email: "user@example.com",
      role,
      agencyId: role === "admin" ? null : "507f1f77bcf86cd799439012",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies SafeUser;
  }
  return request;
}

function runAuthorization(role: UserRole | undefined, allowed: UserRole[]) {
  let result: unknown;
  const next: NextFunction = (error?: unknown) => {
    result = error ?? "allowed";
  };
  authorize(...allowed)(requestFor(role), {} as Response, next);
  return result;
}

test("authorize allows only configured roles", () => {
  assert.equal(runAuthorization("admin", ["admin"]), "allowed");
  assert.equal(runAuthorization("agency", ["admin", "agency"]), "allowed");
  const denied = runAuthorization("telecaller", ["admin"]);
  assert.ok(denied instanceof AppError);
  assert.equal(denied.statusCode, 403);
});

test("authorize requires an authenticated user", () => {
  const denied = runAuthorization(undefined, ["agency"]);
  assert.ok(denied instanceof AppError);
  assert.equal(denied.statusCode, 401);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { Types } from "mongoose";
import type { SafeUser } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";
import { analyticsDateRange, analyticsTenantId, answerRate } from "./analytics.service.js";

const agencyId = new Types.ObjectId().toString();
const agency: SafeUser = { id: new Types.ObjectId().toString(), name: "Owner", email: "owner@example.com", role: "agency", agencyId, status: "active", createdAt: new Date(), updatedAt: new Date() };

test("analytics tenant is derived from the authenticated agency", () => { assert.equal(String(analyticsTenantId(agency)), agencyId); });
test("telecallers cannot access agency-wide analytics", () => { assert.throws(() => analyticsTenantId({ ...agency, role: "telecaller" }), (error: unknown) => error instanceof AppError && error.statusCode === 403); });
test("analytics ranges start at local midnight and include the requested days", () => { const now = new Date(2026, 8, 2, 15, 30); const today = analyticsDateRange("today", now); const seven = analyticsDateRange("7d", now); const thirty = analyticsDateRange("30d", now); assert.equal(today.start.getHours(), 0); assert.equal(today.start.getDate(), 2); assert.equal(seven.start.getDate(), 27); assert.equal(thirty.start.getDate(), 4); assert.equal(today.end.getTime(), now.getTime()); });
test("answer rate handles zero calls and rounds to one decimal", () => { assert.equal(answerRate(0, 0), 0); assert.equal(answerRate(2, 3), 66.7); });

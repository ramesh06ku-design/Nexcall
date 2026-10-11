import type { RequestHandler } from "express";
import { getUserById } from "../services/auth.service.js";
import { sessionCookie, verifySessionToken } from "../services/token.service.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const authenticate: RequestHandler = asyncHandler(async (request, _response, next) => { const token = request.cookies?.[sessionCookie.name] as string | undefined; if (!token) throw new AppError(401, "Authentication required"); try { const payload = verifySessionToken(token); request.user = await getUserById(payload.sub); next(); } catch (error) { if (error instanceof AppError) throw error; throw new AppError(401, "Your session is invalid or expired"); } });

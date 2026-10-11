import type { ErrorRequestHandler, RequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
export const notFoundHandler: RequestHandler = (request, _response, next) => next(new AppError(404, `Route not found: ${request.method} ${request.path}`));
export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => { const isAppError = error instanceof AppError; const statusCode = isAppError ? error.statusCode : 500; const message = isAppError ? error.message : "An unexpected error occurred"; if (!isAppError) console.error(error); response.status(statusCode).json({ success: false, message, ...(isAppError && error.details ? { errors: error.details } : {}), ...(env.NODE_ENV === "development" && error instanceof Error ? { stack: error.stack } : {}) }); };

import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/AppError.js";
export function validateBody(schema: ZodType): RequestHandler { return (request, _response, next) => { const result = schema.safeParse(request.body); if (!result.success) return next(new AppError(400, "Please check the submitted fields", result.error.flatten().fieldErrors)); request.body = result.data; next(); }; }

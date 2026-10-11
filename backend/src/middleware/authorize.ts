import type { RequestHandler } from "express";
import type { UserRole } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";
export function authorize(...roles: UserRole[]): RequestHandler { return (request, _response, next) => { if (!request.user) return next(new AppError(401, "Authentication required")); if (!roles.includes(request.user.role)) return next(new AppError(403, "You do not have access to this resource")); next(); }; }

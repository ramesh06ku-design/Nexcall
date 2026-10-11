import type { SafeUser } from "./domain.js";
declare global { namespace Express { interface Request { user?: SafeUser; } } }
export {};

import type { Request, Response } from "express";
import {
  getAuthenticatedUserProfile,
  loginAgencyOrAdmin,
  loginWorker,
  signupAgency,
} from "../services/auth.service.js";
import {
  clearSessionCookieOptions,
  createSessionToken,
  sessionCookie,
} from "../services/token.service.js";

function setAuthenticatedSession(response: Response, user: { id: string; role: "admin" | "agency" | "telecaller" }) {
  const token = createSessionToken({ sub: user.id, role: user.role });
  response.cookie(sessionCookie.name, token, sessionCookie.options);
}

export async function signupController(request: Request, response: Response) {
  const user = await signupAgency(request.body);
  setAuthenticatedSession(response, user);
  response.status(201).json({
    success: true,
    data: user,
    message: "Agency created successfully",
  });
}

export async function loginController(request: Request, response: Response) {
  const user = await loginAgencyOrAdmin({
    identifier: request.body.email,
    password: request.body.password,
  });
  setAuthenticatedSession(response, user);
  response.json({ success: true, data: user, message: "Signed in successfully" });
}

export async function workerLoginController(request: Request, response: Response) {
  const user = await loginWorker(request.body);
  setAuthenticatedSession(response, user);
  response.json({ success: true, data: user, message: "Signed in successfully" });
}

export function logoutController(_request: Request, response: Response) {
  response
    .clearCookie(sessionCookie.name, clearSessionCookieOptions)
    .json({ success: true, message: "Signed out successfully" });
}

export async function meController(request: Request, response: Response) {
  const user = await getAuthenticatedUserProfile(request.user!);
  response.json({ success: true, data: user });
}

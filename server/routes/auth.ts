/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import type { Express } from "express";
import passport from "passport";
import { toPublicUser } from "../serializers/user";
import {
  AppError,
  createAppContext,
  recordLoginFailure,
  recordLoginSuccess,
  recordLogout,
  registerUser,
} from "../application";
import { buildAuditRequestContext } from "../http/audit-context";

export function registerAuthRoutes(app: Express) {
  const appContext = createAppContext();

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).send("Email and password are required");
      }

      const user = await registerUser(appContext, buildAuditRequestContext(req), { email, password, name });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(toPublicUser(user));
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.status).send(error.message);
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        await recordLoginFailure(appContext, buildAuditRequestContext(req), {
          email: req.body?.email,
          reason: info?.message,
        });
        return res.status(401).send(info?.message || "Authentication failed");
      }

      req.login(user, async (loginErr) => {
        if (loginErr) return next(loginErr);
        await recordLoginSuccess(appContext, buildAuditRequestContext(req), { user });
        res.status(200).json(toPublicUser(user));
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res, next) => {
    const user = req.user;
    req.logout(async (err) => {
      if (err) return next(err);
      if (user) {
        await recordLogout(appContext, buildAuditRequestContext(req), { user: user as any });
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(toPublicUser(req.user as any));
  });
}

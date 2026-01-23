/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import type { Express } from "express";
import passport from "passport";
import { z } from "zod";
import { toPublicUser } from "../serializers/user";
import {
  AppError,
  createAppContext,
  recordLoginFailure,
  recordLoginSuccess,
  recordLogout,
  registerUser,
  updateUserProfile,
} from "../application";
import { buildAuditRequestContext } from "../http/audit-context";

const profileUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  clinicName: z.string().optional(),
  credentials: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

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

  app.patch("/api/user/profile", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const updates = profileUpdateSchema.parse(req.body);
      const user = req.user as any;

      const updatedUser = await updateUserProfile(
        appContext,
        buildAuditRequestContext(req),
        { userId: user.id, updates }
      );

      res.json(toPublicUser(updatedUser));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      if (error instanceof AppError) {
        return res.status(error.status).send(error.message);
      }
      next(error);
    }
  });
}

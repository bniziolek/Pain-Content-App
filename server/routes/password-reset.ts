/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import type { Express } from "express";
import {
  createAppContextWithInfrastructure,
  requestPasswordReset,
  resetPassword,
} from "../application";

const appContext = createAppContextWithInfrastructure();

export function registerPasswordResetRoutes(app: Express) {
  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Always return success to prevent email enumeration attacks
      const baseUrl = req.headers.origin || `https://${req.headers.host}`;
      await requestPasswordReset(appContext, {
        email,
        baseUrl,
      });
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }
      
      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
      }
      if (!/[a-z]/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one lowercase letter" });
      }
      if (!/\d/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one number" });
      }
      
      const result = await resetPassword(appContext, { token, newPassword: password });
      if (!result.success) {
        return res.status(400).json({ error: "Invalid or expired reset link" });
      }
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
}

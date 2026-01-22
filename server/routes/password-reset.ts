import type { Express } from "express";
import crypto from "crypto";
import { storage } from "../storage";
import { sendPasswordResetEmail } from "../gmail";
import { hashPassword } from "../auth";

export function registerPasswordResetRoutes(app: Express) {
  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Always return success to prevent email enumeration attacks
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (user) {
        // Generate a secure token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        // Store the token
        await storage.createPasswordResetToken(user.id, token, expiresAt);
        
        // Send the reset email
        const baseUrl = req.headers.origin || `https://${req.headers.host}`;
        const resetLink = `${baseUrl}/forgot-password?token=${token}`;
        
        await sendPasswordResetEmail({
          toEmail: email,
          resetLink,
        });
      }
      
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
      
      // Find the token
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset link" });
      }
      
      if (resetToken.usedAt) {
        return res.status(400).json({ error: "This reset link has already been used" });
      }
      
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: "This reset link has expired" });
      }
      
      // Update the password
      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(token);
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
}

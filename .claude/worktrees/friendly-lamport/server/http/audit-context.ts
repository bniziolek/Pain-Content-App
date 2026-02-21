/**
 * Architecture: HTTP utilities used by routes (request context, auth helpers, serialization).
 */

import type { Request } from "express";
import type { AuditRequestContext } from "../application";

export function buildAuditRequestContext(req: Request): AuditRequestContext {
  const forwarded = req.headers["x-forwarded-for"];
  let ipAddress = "unknown";
  if (typeof forwarded === "string") {
    ipAddress = forwarded.split(",")[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    ipAddress = forwarded[0];
  } else if (req.socket?.remoteAddress) {
    ipAddress = req.socket.remoteAddress;
  }

  return {
    ipAddress,
    userAgent: req.headers["user-agent"] || "unknown",
    sessionId: req.sessionID ?? null,
  };
}

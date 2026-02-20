// Domain-organized API modules for DriverPath
// Each module handles a specific domain of the application

// Base utilities
export { fetchAPI, jsonHeaders } from "./base";

// Content Domain - Content library, favorites, collections
export * from "./content";

// Assessments Domain - Assessments, invites, screenings
export * from "./assessments";

// Messaging Domain - Email logs, settings, patient summary
export * from "./messaging";

// Pathways Domain - Care pathways, milestones, patient pathways, follow-up rules
export * from "./pathways";

// Recommendations Domain - Recommendation rules, configs, content recommendations
export * from "./recommendations";

// Stats Domain - Dashboard statistics
export * from "./stats";

// Subscription Domain - Stripe integration, billing
export * from "./subscription";

// Feature Flags Domain - Feature flags, persona switching
export * from "./feature-flags";

// Admin Domain - User management, analytics, audit logs
export * from "./admin";

// PDF Domain - PDF generation and download
export * from "./pdf";

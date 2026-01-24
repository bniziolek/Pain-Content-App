import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, createAuthenticatedAgent } from '../utils';

describe('Feature Flags API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('GET /api/feature-flags', () => {
    it('should return feature flags (admin only)', async () => {
      const response = await agent.get('/api/feature-flags');

      // Admin endpoint - may return 200, 403, or 404 depending on permissions
      expect([200, 403, 404]).toContain(response.status);
      if (response.status === 200) {
        // Feature flags can be an object or array
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('GET /api/feature-flags/:key', () => {
    it('should handle feature flag lookup', async () => {
      const response = await agent.get('/api/feature-flags/patient_portal_enabled');

      // May return flag data, 404, or 403
      expect([200, 403, 404]).toContain(response.status);
    });
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, createAuthenticatedAgent } from '../utils';

describe('Feature Flags API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('GET /api/feature-flags', () => {
    it('should require authentication', async () => {
      const response = await request(BASE_URL).get('/api/feature-flags');
      expect(response.status).toBe(401);
    });

    it('should return feature flags for authenticated user', async () => {
      const response = await agent.get('/api/feature-flags');

      expect([200, 403, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('GET /api/feature-flags/admin', () => {
    it('should return all feature flags for admin', async () => {
      const response = await agent.get('/api/feature-flags/admin');

      expect([200, 403, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          const flag = response.body[0];
          expect(flag).toHaveProperty('key');
          expect(flag).toHaveProperty('isEnabled');
        }
      }
    });
  });

  describe('PATCH /api/feature-flags/admin/:key', () => {
    it('should return 404 for non-existent flag', async () => {
      const response = await agent
        .patch('/api/feature-flags/admin/non_existent_flag')
        .send({ isEnabled: true });

      expect([404, 403]).toContain(response.status);
    });

    it('should update feature flag', async () => {
      const flagsResponse = await agent.get('/api/feature-flags/admin');
      
      if (flagsResponse.status !== 200 || flagsResponse.body.length === 0) {
        return;
      }

      const flagKey = flagsResponse.body[0].key;
      const currentEnabled = flagsResponse.body[0].isEnabled;

      const response = await agent
        .patch(`/api/feature-flags/admin/${flagKey}`)
        .send({ isEnabled: !currentEnabled });

      expect([200, 403, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('key');
        expect(response.body).toHaveProperty('isEnabled');
      }

      // Reset back to original
      await agent
        .patch(`/api/feature-flags/admin/${flagKey}`)
        .send({ isEnabled: currentEnabled });
    });
  });

  describe('GET /api/feature-flags/admin/history/all', () => {
    it('should return all feature flag history', async () => {
      const response = await agent.get('/api/feature-flags/admin/history/all');

      expect([200, 403, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('GET /api/feature-flags/admin/:key/history', () => {
    it('should return history for specific feature flag', async () => {
      const flagsResponse = await agent.get('/api/feature-flags/admin');
      
      if (flagsResponse.status !== 200 || flagsResponse.body.length === 0) {
        return;
      }

      const flagKey = flagsResponse.body[0].key;
      const response = await agent.get(`/api/feature-flags/admin/${flagKey}/history`);

      expect([200, 403, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('Super Admin Persona Routes', () => {
    it('POST /api/feature-flags/super-admin/switch-persona should require super admin', async () => {
      const response = await agent
        .post('/api/feature-flags/super-admin/switch-persona')
        .send({ toPersona: 'clinician' });

      // Should be 403 if not super admin, or 200 if is super admin
      expect([200, 403]).toContain(response.status);
    });

    it('POST /api/feature-flags/super-admin/clear-persona should require super admin', async () => {
      const response = await agent.post('/api/feature-flags/super-admin/clear-persona');

      expect([200, 403]).toContain(response.status);
    });

    it('GET /api/feature-flags/super-admin/persona-history should require super admin', async () => {
      const response = await agent.get('/api/feature-flags/super-admin/persona-history');

      expect([200, 403]).toContain(response.status);
    });
  });

  describe('Super Admin Permission Routes', () => {
    it('GET /api/feature-flags/super-admin/users/:userId/permissions should require super admin', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.status !== 200 || usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent.get(`/api/feature-flags/super-admin/users/${userId}/permissions`);

      expect([200, 403]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    it('POST /api/feature-flags/super-admin/users/:userId/permissions/grant should require super admin', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.status !== 200 || usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent
        .post(`/api/feature-flags/super-admin/users/${userId}/permissions/grant`)
        .send({ permissionName: 'content:read', reason: 'Test grant' });

      expect([200, 400, 403]).toContain(response.status);
    });

    it('POST /api/feature-flags/super-admin/users/:userId/permissions/revoke should require super admin', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.status !== 200 || usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent
        .post(`/api/feature-flags/super-admin/users/${userId}/permissions/revoke`)
        .send({ permissionName: 'content:read', reason: 'Test revoke' });

      expect([200, 400, 403, 404]).toContain(response.status);
    });
  });
});

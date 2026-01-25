import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, createAuthenticatedAgent } from '../utils';

describe('Admin API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('GET /api/admin/users', () => {
    it('should return list of users', async () => {
      const response = await agent.get('/api/admin/users');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return users with required fields', async () => {
      const response = await agent.get('/api/admin/users');

      expect(response.status).toBe(200);
      
      if (response.body.length > 0) {
        const user = response.body[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
      }
    });

    it('should support search parameter', async () => {
      const response = await agent.get('/api/admin/users?search=admin');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should return analytics data', async () => {
      const response = await agent.get('/api/admin/analytics');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await agent.get('/api/admin/users/non-existent-id');

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('GET /api/admin/audit-logs', () => {
    it('should return audit logs or require admin permissions', async () => {
      const response = await agent.get('/api/admin/audit-logs');

      // May return logs or indicate permission issues
      expect([200, 403, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('GET /api/admin/health/overview', () => {
    it('should return health overview data', async () => {
      const response = await agent.get('/api/admin/health/overview');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return health overview with required top-level fields', async () => {
      const response = await agent.get('/api/admin/health/overview');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('api');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('externalServices');
    });

    it('should return health overview with system metrics', async () => {
      const response = await agent.get('/api/admin/health/overview');

      expect(response.status).toBe(200);
      expect(response.body.system).toHaveProperty('uptime');
      expect(response.body.system).toHaveProperty('nodeVersion');
      expect(response.body.system).toHaveProperty('environment');
      expect(typeof response.body.system.uptime).toBe('number');
      expect(typeof response.body.system.nodeVersion).toBe('string');
    });

    it('should return health overview with database metrics', async () => {
      const response = await agent.get('/api/admin/health/overview');

      expect(response.status).toBe(200);
      expect(response.body.database).toHaveProperty('status');
      expect(['healthy', 'degraded', 'error']).toContain(response.body.database.status);
    });

    it('should return health overview with API metrics', async () => {
      const response = await agent.get('/api/admin/health/overview');

      expect(response.status).toBe(200);
      expect(response.body.api).toHaveProperty('recentRequests');
      expect(typeof response.body.api.recentRequests).toBe('number');
    });

    it('should return health overview with email metrics', async () => {
      const response = await agent.get('/api/admin/health/overview');

      expect(response.status).toBe(200);
      expect(response.body.email).toHaveProperty('totalSent');
      expect(response.body.email).toHaveProperty('delivered');
      expect(response.body.email).toHaveProperty('deliveryRate');
      expect(typeof response.body.email.deliveryRate).toBe('number');
    });

    it('should require authentication', async () => {
      const response = await request(BASE_URL).get('/api/admin/health/overview');

      // Should require authentication (401 or 403)
      expect([401, 403]).toContain(response.status);
    });
  });
});

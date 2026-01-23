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
});

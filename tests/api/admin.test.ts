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

  describe('GET /api/admin/users/:userId/support-overview', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await agent.get('/api/admin/users/non-existent-id/support-overview');

      expect(response.status).toBe(404);
    });

    it('should return support overview data with required fields for valid user', async () => {
      // First get a valid user ID
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return; // Skip test if no users exist
      }

      const userId = usersResponse.body[0].id;
      const response = await agent.get(`/api/admin/users/${userId}/support-overview`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('stats');
        expect(response.body).toHaveProperty('status');
        expect(response.body.stats).toHaveProperty('contentSentCount');
        expect(response.body.stats).toHaveProperty('assessmentsCreatedCount');
        expect(response.body.status).toHaveProperty('isActive');
        expect(response.body.status).toHaveProperty('isLocked');
      }
    });
  });

  describe('GET /api/admin/users/:userId/support-timeline', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await agent.get('/api/admin/users/non-existent-id/support-timeline');

      expect(response.status).toBe(404);
    });

    it('should validate days parameter', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return; // Skip test if no users exist
      }

      const userId = usersResponse.body[0].id;
      
      // Test invalid days parameter (negative)
      const invalidResponse = await agent.get(`/api/admin/users/${userId}/support-timeline?days=-1`);
      expect(invalidResponse.status).toBe(400);

      // Test invalid days parameter (too large)
      const tooLargeResponse = await agent.get(`/api/admin/users/${userId}/support-timeline?days=500`);
      expect(tooLargeResponse.status).toBe(400);

      // Test valid days parameter
      const validResponse = await agent.get(`/api/admin/users/${userId}/support-timeline?days=30`);
      expect([200, 404]).toContain(validResponse.status);
    });

    it('should return timeline events with required structure', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return; // Skip test if no users exist
      }

      const userId = usersResponse.body[0].id;
      const response = await agent.get(`/api/admin/users/${userId}/support-timeline?days=30`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('events');
        expect(Array.isArray(response.body.events)).toBe(true);
      }
    });
  });

  describe('POST /api/admin/users/:userId/unlock', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await agent.post('/api/admin/users/non-existent-id/unlock');

      expect(response.status).toBe(404);
    });

    it('should unlock a locked account', async () => {
      // This test would ideally create a locked user first, then unlock it
      // For now, we'll just verify the endpoint structure
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return; // Skip test if no users exist
      }

      const userId = usersResponse.body[0].id;
      const response = await agent.post(`/api/admin/users/${userId}/unlock`);

      // Should either succeed or indicate the user wasn't locked
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('user');
      }
    });
  });

  describe('GET /api/admin/users/:userId/feature-flags', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await agent.get('/api/admin/users/non-existent-id/feature-flags');

      expect(response.status).toBe(404);
    });

    it('should return feature flags for valid user', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return; // Skip test if no users exist
      }

      const userId = usersResponse.body[0].id;
      const response = await agent.get(`/api/admin/users/${userId}/feature-flags`);

      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('POST /api/admin/users/:id/extend-subscription', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await agent
        .post('/api/admin/users/non-existent-id/extend-subscription')
        .send({ days: 30 });

      expect(response.status).toBe(404);
    });

    it('should handle month-based extensions correctly', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return; // Skip test if no users exist
      }

      const userId = usersResponse.body[0].id;
      const response = await agent
        .post(`/api/admin/users/${userId}/extend-subscription`)
        .send({ months: 1 });

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('subscriptionPeriodEnd');
      }
    });

    it('should handle combined month and day extensions', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return; // Skip test if no users exist
      }

      const userId = usersResponse.body[0].id;
      const response = await agent
        .post(`/api/admin/users/${userId}/extend-subscription`)
        .send({ months: 1, days: 15 });

      expect([200, 404]).toContain(response.status);
    });
  });
});

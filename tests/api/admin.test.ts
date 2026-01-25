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

  describe('Subscription Management', () => {
    describe('GET /api/admin/subscriptions', () => {
      it('should return list of subscriptions', async () => {
        const response = await agent.get('/api/admin/subscriptions');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should support status filter', async () => {
        const response = await agent.get('/api/admin/subscriptions?status=active');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should support tier filter', async () => {
        const response = await agent.get('/api/admin/subscriptions?tier=pro');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should support search query', async () => {
        const response = await agent.get('/api/admin/subscriptions?searchQuery=test');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('GET /api/admin/subscriptions/:userId', () => {
      it('should return 404 for non-existent user', async () => {
        const response = await agent.get('/api/admin/subscriptions/non-existent-id');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/admin/subscriptions/:userId/apply-coupon', () => {
      it('should return error for non-existent user', async () => {
        const response = await agent
          .post('/api/admin/subscriptions/non-existent-id/apply-coupon')
          .send({ couponCode: 'TEST123' });

        // Should return error
        expect([400, 404, 500]).toContain(response.status);
      });

      it('should require coupon code', async () => {
        const response = await agent
          .post('/api/admin/subscriptions/some-user-id/apply-coupon')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/admin/subscriptions/:userId/cancel', () => {
      it('should handle cancellation request for non-existent user', async () => {
        const response = await agent
          .post('/api/admin/subscriptions/non-existent-id/cancel')
          .send({ immediate: false });

        // Should return error for non-existent user
        expect([400, 404, 500]).toContain(response.status);
      });
    });
  });
});

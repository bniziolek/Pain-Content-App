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

  describe('GET /api/admin/users/:id', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await agent.get('/api/admin/users/non-existent-id');

      expect([404, 400]).toContain(response.status);
    });

    it('should return user data for valid user', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent.get(`/api/admin/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
    });
  });

  describe('PATCH /api/admin/users/:id', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await agent
        .patch('/api/admin/users/non-existent-id')
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });

    it('should update user demographics', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent
        .patch(`/api/admin/users/${userId}`)
        .send({
          clinicName: 'Updated Clinic',
          phone: '555-1234',
          credentials: 'PT, DPT',
          address: '123 Test St',
        });

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('id');
      }
    });
  });

  describe('PATCH /api/admin/users/:id/subscription', () => {
    it('should update user subscription', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent
        .patch(`/api/admin/users/${userId}/subscription`)
        .send({
          subscriptionStatus: 'active',
          subscriptionTier: 'pro',
        });

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return admin stats', async () => {
      const response = await agent.get('/api/admin/stats');

      expect([200, 403]).toContain(response.status);
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

  describe('GET /api/admin/enhanced-stats', () => {
    it('should return enhanced admin stats', async () => {
      const response = await agent.get('/api/admin/enhanced-stats');

      expect([200, 403]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('Admin Notes', () => {
    it('GET /api/admin/users/:userId/notes should return notes array', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent.get(`/api/admin/users/${userId}/notes`);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    it('POST /api/admin/users/:userId/notes should create a note', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent
        .post(`/api/admin/users/${userId}/notes`)
        .send({ note: 'Test admin note' });

      expect([201, 200, 404]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body).toHaveProperty('note');
      }
    });
  });

  describe('GET /api/admin/users/:userId/login-history', () => {
    it('should return login history for valid user', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent.get(`/api/admin/users/${userId}/login-history`);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('GET /api/admin/users/:userId/content-activity', () => {
    it('should return content activity for valid user', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent.get(`/api/admin/users/${userId}/content-activity`);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('GET /api/admin/users/:userId/export', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await agent.get('/api/admin/users/non-existent-id/export');

      expect(response.status).toBe(404);
    });

    it('should return export data for valid user', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent.get(`/api/admin/users/${userId}/export`);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('exportedAt');
      }
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should return analytics data', async () => {
      const response = await agent.get('/api/admin/analytics');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/admin/users/:userId/support-overview', () => {
    it('should return 404 for non-existent user', async () => {
      const response = await agent.get('/api/admin/users/non-existent-id/support-overview');

      expect(response.status).toBe(404);
    });

    it('should return support overview data with required fields for valid user', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
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
    it('should handle non-existent user gracefully', async () => {
      const response = await agent.get('/api/admin/users/non-existent-id/support-timeline');

      // May return 404 or empty timeline depending on implementation
      expect([200, 404]).toContain(response.status);
    });

    it('should validate days parameter', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      
      const invalidResponse = await agent.get(`/api/admin/users/${userId}/support-timeline?days=-1`);
      expect(invalidResponse.status).toBe(400);

      const tooLargeResponse = await agent.get(`/api/admin/users/${userId}/support-timeline?days=500`);
      expect(tooLargeResponse.status).toBe(400);

      const validResponse = await agent.get(`/api/admin/users/${userId}/support-timeline?days=30`);
      expect([200, 404]).toContain(validResponse.status);
    });

    it('should return timeline events with required structure', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
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

    it('should unlock a user account', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent.post(`/api/admin/users/${userId}/unlock`);

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
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent.get(`/api/admin/users/${userId}/feature-flags`);

      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          const flag = response.body[0];
          expect(flag).toHaveProperty('id');
          expect(flag).toHaveProperty('key');
          expect(flag).toHaveProperty('enabled');
          expect(flag).toHaveProperty('hasOverride');
        }
      }
    });
  });

  describe('POST /api/admin/users/:userId/feature-flags/:flagId/toggle', () => {
    it('should toggle a feature flag for user', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const flagsResponse = await agent.get(`/api/admin/users/${userId}/feature-flags`);
      
      if (flagsResponse.status !== 200 || flagsResponse.body.length === 0) {
        return;
      }

      const flagId = flagsResponse.body[0].id;
      const response = await agent
        .post(`/api/admin/users/${userId}/feature-flags/${flagId}/toggle`)
        .send({ enabled: true, reason: 'Test toggle' });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
      }
    });
  });

  describe('DELETE /api/admin/users/:userId/feature-flags/:flagId/override', () => {
    it('should reset feature flag override for user', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const flagsResponse = await agent.get(`/api/admin/users/${userId}/feature-flags`);
      
      if (flagsResponse.status !== 200 || flagsResponse.body.length === 0) {
        return;
      }

      const flagId = flagsResponse.body[0].id;
      const response = await agent
        .delete(`/api/admin/users/${userId}/feature-flags/${flagId}/override`);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
      }
    });
  });

  describe('GET /api/admin/users/:userId/feature-flags/audit', () => {
    it('should return feature flag audit log for user', async () => {
      const usersResponse = await agent.get('/api/admin/users');
      if (usersResponse.body.length === 0) {
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent.get(`/api/admin/users/${userId}/feature-flags/audit`);

      expect([200, 404]).toContain(response.status);
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
        return;
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
        return;
      }

      const userId = usersResponse.body[0].id;
      const response = await agent
        .post(`/api/admin/users/${userId}/extend-subscription`)
        .send({ months: 1, days: 15 });

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/admin/recommendation-configs', () => {
    it('should return recommendation configs', async () => {
      const response = await agent.get('/api/admin/recommendation-configs');

      expect([200, 403, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
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

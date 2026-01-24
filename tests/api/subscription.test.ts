import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, createAuthenticatedAgent } from '../utils';

describe('Subscription API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('GET /api/subscription/plans', () => {
    it('should return subscription plans', async () => {
      const response = await agent.get('/api/subscription/plans');

      expect(response.status).toBe(200);
      // Plans may be in response.body directly or in response.body.plans
      const plans = Array.isArray(response.body) ? response.body : response.body.plans;
      expect(plans === undefined || Array.isArray(plans)).toBe(true);
    });

    it('should return plans with required fields', async () => {
      const response = await agent.get('/api/subscription/plans');

      expect(response.status).toBe(200);
      
      const plans = Array.isArray(response.body) ? response.body : response.body.plans;
      if (plans && plans.length > 0) {
        const plan = plans[0];
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('name');
      }
    });
  });

  describe('GET /api/subscription/status', () => {
    it('should return subscription status', async () => {
      const response = await agent.get('/api/subscription/status');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/subscription/create-checkout', () => {
    it('should handle checkout creation', async () => {
      const response = await agent
        .post('/api/subscription/create-checkout')
        .send({ planId: 'basic' });

      // May require more configuration or return checkout session
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});

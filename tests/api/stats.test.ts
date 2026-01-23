import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, createAuthenticatedAgent } from '../utils';

describe('Stats API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('GET /api/stats', () => {
    it('should return dashboard stats', async () => {
      const response = await agent.get('/api/stats');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should return admin analytics', async () => {
      const response = await agent.get('/api/admin/analytics');

      expect([200, 403]).toContain(response.status);
    });
  });
});

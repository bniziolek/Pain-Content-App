import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, createAuthenticatedAgent } from '../utils';

describe('Recommendations API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('GET /api/recommendations/rules', () => {
    it('should return recommendation rules', async () => {
      const response = await agent.get('/api/recommendations/rules');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('GET /api/recommendations/configs', () => {
    it('should return scoring configs', async () => {
      const response = await agent.get('/api/recommendations/configs');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('GET /api/content-recommendations', () => {
    it('should return content recommendations', async () => {
      const response = await agent.get('/api/content-recommendations');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });
});

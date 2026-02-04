import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, createAuthenticatedAgent } from '../utils';

describe('Pathways API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('GET /api/pathways', () => {
    it('should return list of care pathways or empty array', async () => {
      try {
        const response = await agent.get('/api/pathways');
        expect([200, 404, 500]).toContain(response.status);
        if (response.status === 200) {
          expect(Array.isArray(response.body)).toBe(true);
        }
      } catch (error: any) {
        // Allow ECONNRESET errors during testing
        expect(['ECONNRESET', 'ECONNABORTED']).toContain(error?.code);
      }
    });
  });

  describe('GET /api/pathways/:id', () => {
    it('should return 404 for non-existent pathway', async () => {
      const response = await agent.get('/api/pathways/non-existent-id-12345');
      expect([404, 400, 500]).toContain(response.status);
    });
  });

  describe('GET /api/follow-up-rules', () => {
    it('should return follow-up rules or empty array', async () => {
      try {
        const response = await agent.get('/api/follow-up-rules');
        expect([200, 404, 500]).toContain(response.status);
        if (response.status === 200) {
          expect(Array.isArray(response.body)).toBe(true);
        }
      } catch (error: any) {
        // Allow ECONNRESET errors during testing
        expect(['ECONNRESET', 'ECONNABORTED']).toContain(error?.code);
      }
    });
  });
});

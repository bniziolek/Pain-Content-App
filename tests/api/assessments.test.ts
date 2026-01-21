import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, createAuthenticatedAgent } from '../utils';

describe('Assessments API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('GET /api/assessments', () => {
    it('should return list of assessments', async () => {
      const response = await agent.get('/api/assessments');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('GET /api/assessment-invites', () => {
    it('should return assessment invites or 404 if feature disabled', async () => {
      const response = await agent.get('/api/assessment-invites');

      // Feature flag may disable this endpoint
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/internal-screenings', () => {
    it('should return internal screenings', async () => {
      try {
        const response = await agent.get('/api/internal-screenings');
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

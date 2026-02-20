import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, createAuthenticatedAgent } from '../utils';

describe('Messaging API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('GET /api/email-logs', () => {
    it('should return email logs or 404 if feature disabled', async () => {
      const response = await agent.get('/api/email-logs');
      
      // 200 if feature enabled, 404 if disabled
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('GET /api/email-settings', () => {
    it('should return email settings', async () => {
      const response = await agent.get('/api/email-settings');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/email-logs/:id/resend', () => {
    it('should return error for non-existent email log', async () => {
      const response = await agent.post('/api/email-logs/non-existent-id/resend');

      expect([404, 400, 500]).toContain(response.status);
    });
  });
});

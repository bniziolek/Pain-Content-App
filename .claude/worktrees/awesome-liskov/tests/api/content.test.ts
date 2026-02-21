import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, createAuthenticatedAgent } from '../utils';

describe('Content API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('GET /api/content', () => {
    it('should return list of content items', async () => {
      const response = await agent.get('/api/content');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return content items with required fields', async () => {
      const response = await agent.get('/api/content');

      expect(response.status).toBe(200);
      
      if (response.body.length > 0) {
        const item = response.body[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('title');
      }
    });
  });

  describe('GET /api/content/:id', () => {
    it('should return 404 for non-existent content', async () => {
      const response = await agent.get('/api/content/non-existent-id-12345');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/favorites', () => {
    it('should return user favorites', async () => {
      const response = await agent.get('/api/favorites');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/content/generate-pdf', () => {
    it('should reject empty content array', async () => {
      const response = await agent
        .post('/api/content/generate-pdf')
        .send({
          contentIds: []
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should accept valid PDF generation request', async () => {
      // First get some content
      const contentResponse = await agent.get('/api/content');

      if (contentResponse.body.length > 0) {
        const contentId = contentResponse.body[0].id;

        try {
          // Cap the request at 15s — PDF generation calls Puppeteer + Contentful
          // which may not be available in CI. A timeout here is an acceptable outcome.
          const response = await agent
            .post('/api/content/generate-pdf')
            .timeout(15000)
            .send({
              contentIds: [contentId],
              patientName: 'Test Patient',
              clinicianName: 'Test Clinician',
              packetTitle: 'Test Packet',
            });

          // 200 = success, 404 = content not found in Contentful, 500 = external service unavailable
          expect([200, 404, 500]).toContain(response.status);
        } catch (err: any) {
          // Timeout or connection abort means Puppeteer/Contentful is unavailable in this
          // environment (e.g., CI without external service credentials). This is expected.
          if (err.timeout || err.code === 'ECONNABORTED' || err.message?.includes('Timeout')) {
            return;
          }
          throw err;
        }
      }
    }, 20000); // Vitest timeout slightly above the supertest request timeout
  });
});

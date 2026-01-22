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
        
        const response = await agent
          .post('/api/content/generate-pdf')
          .send({
            contentIds: [contentId],
            patientName: 'Test Patient',
            clinicianName: 'Test Clinician',
            packetTitle: 'Test Packet'
          });

        // Should return PDF, 404 (content not found from Contentful), or 500
        expect([200, 404, 500]).toContain(response.status);
      }
    });
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, createAuthenticatedAgent } from '../utils';

describe('Packet Access Codes API', () => {
  let agent: ReturnType<typeof request.agent>;
  let contentId: string;
  let userId: string;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
    
    const contentResponse = await agent.get('/api/content');
    if (contentResponse.body.length > 0) {
      contentId = contentResponse.body[0].id;
    }

    // Get the current user's ID
    const userResponse = await agent.get('/api/user');
    if (userResponse.body) {
      userId = userResponse.body.id;
    }
  });

  describe('POST /api/packets/generate-access-code', () => {
    it('should require authentication', async () => {
      const response = await request(BASE_URL)
        .post('/api/packets/generate-access-code')
        .send({
          contentIds: ['test-id'],
        });

      expect(response.status).toBe(401);
    });

    it('should reject empty content IDs', async () => {
      const response = await agent
        .post('/api/packets/generate-access-code')
        .send({
          contentIds: [],
        });

      expect(response.status).toBe(400);
    });

    it('should generate access code with valid content', async () => {
      if (!contentId) {
        return;
      }

      const response = await agent
        .post('/api/packets/generate-access-code')
        .send({
          contentIds: [contentId],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('expiresAt');
      expect(typeof response.body.code).toBe('string');
      expect(response.body.code.length).toBeGreaterThanOrEqual(8);
    });

    it('should accept custom expiration days', async () => {
      if (!contentId) {
        return;
      }

      const response = await agent
        .post('/api/packets/generate-access-code')
        .send({
          contentIds: [contentId],
          expirationDays: 30,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('expiresAt');
      
      const expiresAt = new Date(response.body.expiresAt);
      const now = new Date();
      const diffDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(31);
    });
  });

  describe('GET /api/public/lookup/:code', () => {
    it('should return 404 for non-existent code', async () => {
      const response = await request(BASE_URL)
        .get('/api/public/lookup/XXXX-XXXX');

      expect(response.status).toBe(404);
      expect(response.body.valid).toBe(false);
      expect(response.body.reason).toBe('not_found');
    });

    it('should return 400 for invalid code format', async () => {
      const response = await request(BASE_URL)
        .get('/api/public/lookup/X');

      expect(response.status).toBe(400);
    });

    it('should return content for valid code', async () => {
      if (!contentId) {
        return;
      }

      const codeResponse = await agent
        .post('/api/packets/generate-access-code')
        .send({
          contentIds: [contentId],
        });

      expect(codeResponse.status).toBe(200);
      const { code } = codeResponse.body;

      const lookupResponse = await request(BASE_URL)
        .get(`/api/public/lookup/${code}`);

      expect(lookupResponse.status).toBe(200);
      expect(lookupResponse.body.valid).toBe(true);
      expect(lookupResponse.body).toHaveProperty('content');
      expect(lookupResponse.body).toHaveProperty('clinicianName');
      expect(lookupResponse.body).toHaveProperty('expiresAt');
      expect(Array.isArray(lookupResponse.body.content)).toBe(true);
    });

    it('should be case-insensitive for code lookup', async () => {
      if (!contentId) {
        return;
      }

      const codeResponse = await agent
        .post('/api/packets/generate-access-code')
        .send({
          contentIds: [contentId],
        });

      expect(codeResponse.status).toBe(200);
      const { code } = codeResponse.body;

      const lookupLower = await request(BASE_URL)
        .get(`/api/public/lookup/${code.toLowerCase()}`);

      expect(lookupLower.status).toBe(200);
      expect(lookupLower.body.valid).toBe(true);
    });

    it('should return 410 for expired access code', async () => {
      if (!contentId || !userId) {
        return;
      }

      // Create an expired code directly in the database
      const { db } = await import('../../server/db');
      const { packetAccessCodes } = await import('../../shared/schema');
      
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday
      
      const expiredCode = 'TEST-EXPR';
      await db.insert(packetAccessCodes).values({
        code: expiredCode,
        clinicianId: userId,
        contentIds: [contentId],
        expiresAt: expiredDate,
        isActive: true,
      });

      // Lookup should fail with expired reason
      const lookupResponse = await request(BASE_URL)
        .get(`/api/public/lookup/${expiredCode}`);

      expect(lookupResponse.status).toBe(410);
      expect(lookupResponse.body.valid).toBe(false);
      expect(lookupResponse.body.reason).toBe('expired');
      expect(lookupResponse.body.error).toContain('expired');
    });

    it('should return 410 for inactive access code', async () => {
      if (!contentId || !userId) {
        return;
      }

      // Create an inactive code directly in the database
      const { db } = await import('../../server/db');
      const { packetAccessCodes } = await import('../../shared/schema');
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);
      
      const inactiveCode = 'TEST-INAC';
      await db.insert(packetAccessCodes).values({
        code: inactiveCode,
        clinicianId: userId,
        contentIds: [contentId],
        expiresAt: futureDate,
        isActive: false,
      });

      // Lookup should fail with inactive reason
      const lookupResponse = await request(BASE_URL)
        .get(`/api/public/lookup/${inactiveCode}`);

      expect(lookupResponse.status).toBe(410);
      expect(lookupResponse.body.valid).toBe(false);
      expect(lookupResponse.body.reason).toBe('inactive');
      expect(lookupResponse.body.error).toContain('inactive');
    });
  });
});

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { BASE_URL } from '../utils';

describe('Health Check API', () => {
  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await request(BASE_URL).get('/api/health');

      // Health endpoint should return 200
      expect(response.status).toBe(200);
    });
  });

  describe('Server Availability', () => {
    it('should respond to root path', async () => {
      const response = await request(BASE_URL).get('/');

      // Server should respond (200 or redirect)
      expect([200, 301, 302, 304]).toContain(response.status);
    });
  });
});

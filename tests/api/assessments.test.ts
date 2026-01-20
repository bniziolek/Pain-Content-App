import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Assessments API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    agent = request.agent(BASE_URL);
    
    // Login before tests
    await agent
      .post('/api/login')
      .send({
        email: 'admin@driverpath.com',
        password: 'admin123'
      });
  });

  describe('GET /api/assessments', () => {
    it('should return list of assessments', async () => {
      const response = await agent.get('/api/assessments');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/invites', () => {
    it('should return assessment invites', async () => {
      const response = await agent.get('/api/invites');

      expect(response.status).toBe(200);
      // API may return an array or paginated object
      expect(response.body).toBeDefined();
    });
  });

  describe('GET /api/internal-screenings', () => {
    it('should return internal screenings', async () => {
      const response = await agent.get('/api/internal-screenings');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

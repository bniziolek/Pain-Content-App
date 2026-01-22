import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, TEST_ADMIN } from '../utils';

describe('Authentication API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(() => {
    agent = request.agent(BASE_URL);
  });

  describe('POST /api/login', () => {
    it('should login with valid credentials', async () => {
      const response = await agent
        .post('/api/login')
        .send({
          email: 'admin@driverpath.com',
          password: 'admin123'
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      // API returns user directly, not wrapped in { user: ... }
      expect(response.body).toHaveProperty('email', 'admin@driverpath.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(BASE_URL)
        .post('/api/login')
        .send({
          email: 'invalid@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });

    it('should reject missing email', async () => {
      const response = await request(BASE_URL)
        .post('/api/login')
        .send({
          password: 'somepassword'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject missing password', async () => {
      const response = await request(BASE_URL)
        .post('/api/login')
        .send({
          email: 'admin@driverpath.com'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/user', () => {
    it('should return current user when authenticated', async () => {
      // Login first
      await agent
        .post('/api/login')
        .send({
          email: 'admin@driverpath.com',
          password: 'admin123'
        });

      const response = await agent.get('/api/user');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'admin@driverpath.com');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(BASE_URL).get('/api/user');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/logout', () => {
    it('should logout successfully', async () => {
      // Login first
      await agent
        .post('/api/login')
        .send({
          email: 'admin@driverpath.com',
          password: 'admin123'
        });

      const response = await agent.post('/api/logout');

      expect(response.status).toBe(200);
    });
  });
});

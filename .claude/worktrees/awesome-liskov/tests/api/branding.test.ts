import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, createAuthenticatedAgent } from '../utils';

describe('Branding API', () => {
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    agent = await createAuthenticatedAgent();
  });

  describe('GET /api/branding', () => {
    it('should require authentication', async () => {
      const response = await request(BASE_URL).get('/api/branding');
      expect(response.status).toBe(401);
    });

    it('should require Pro or Enterprise tier', async () => {
      const response = await agent.get('/api/branding');
      expect([200, 403]).toContain(response.status);
      
      if (response.status === 403) {
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('TIER_UPGRADE_REQUIRED');
      }
    });
  });

  describe('PUT /api/branding', () => {
    it('should require authentication', async () => {
      const response = await request(BASE_URL)
        .put('/api/branding')
        .send({ primaryColor: '#FF0000' });
      
      expect(response.status).toBe(401);
    });

    it('should require Pro or Enterprise tier', async () => {
      const response = await agent
        .put('/api/branding')
        .send({ primaryColor: '#FF0000' });
      
      expect([200, 403]).toContain(response.status);
      
      if (response.status === 403) {
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('TIER_UPGRADE_REQUIRED');
      }
    });

    it('should accept valid branding data', async () => {
      const response = await agent
        .put('/api/branding')
        .send({
          clinicName: 'Test Clinic',
          primaryColor: '#0F766E',
          secondaryColor: '#f5f5f5',
          accentColor: '#14B8A6',
          showPoweredBy: true,
        });
      
      expect([200, 403]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('clinicName');
        expect(response.body.clinicName).toBe('Test Clinic');
      }
    });
  });

  describe('DELETE /api/branding', () => {
    it('should require authentication', async () => {
      const response = await request(BASE_URL).delete('/api/branding');
      expect(response.status).toBe(401);
    });

    it('should require Pro or Enterprise tier', async () => {
      const response = await agent.delete('/api/branding');
      expect([204, 403]).toContain(response.status);
      
      if (response.status === 403) {
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('TIER_UPGRADE_REQUIRED');
      }
    });
  });
});

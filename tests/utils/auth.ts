import request from 'supertest';

export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

export const TEST_ADMIN = {
  email: 'admin@driverpath.com',
  password: 'admin123'
};

export async function createAuthenticatedAgent() {
  const agent = request.agent(BASE_URL);
  
  await agent
    .post('/api/login')
    .send(TEST_ADMIN);
  
  return agent;
}

export async function loginAsAdmin(agent: ReturnType<typeof request.agent>) {
  const response = await agent
    .post('/api/login')
    .send(TEST_ADMIN);
  
  return response;
}

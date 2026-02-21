
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { BASE_URL, createAuthenticatedAgent } from '../utils';

import { TEST_ADMIN } from '../utils/auth';
import { storage } from '../../server/storage';

// Helper to create a clinician agent
async function createClinicianAgent() {
    const agent = request.agent(BASE_URL);

    // Register a new user
    const email = `clinician-${Date.now()}@test.com`;
    await agent
        .post('/api/register')
        .send({
            email,
            password: 'Password123!',
            name: 'Test Clinician',
            role: 'clinician'
        });

    // Login
    await agent
        .post('/api/login')
        .send({
            email,
            password: 'Password123!'
        });

    return agent;
}

describe('Content Moderation API', () => {
    let adminAgent: ReturnType<typeof request.agent>;
    let clinicianAgent: ReturnType<typeof request.agent>;
    let contentId: string;

    beforeAll(async () => {
        // Ensure admin exists
        try {
            await request(BASE_URL).post('/api/register').send({
                email: TEST_ADMIN.email,
                password: TEST_ADMIN.password,
                name: 'Admin User'
            });
            const user = await storage.getUserByEmail(TEST_ADMIN.email);
            if (user) {
                await storage.updateUserRole(user.id, 'admin');
            }
        } catch (e) {
            // Check if user exists anyway
            const user = await storage.getUserByEmail(TEST_ADMIN.email);
            if (user && user.role !== 'admin') {
                await storage.updateUserRole(user.id, 'admin');
            }
        }

        adminAgent = await createAuthenticatedAgent();
        clinicianAgent = await createClinicianAgent();
    });

    it('should allow clinician to submit content (pending)', async () => {
        const res = await clinicianAgent
            .post('/api/content')
            .send({
                title: 'User Submitted Content',
                summary: 'Summary of content',
                body: 'Body of content',
                tags: ['test'],
                readTime: '5 min'
            });

        if (res.status !== 201) {
            console.error('Clinician submit failed:', res.status, res.body);
        }

        expect(res.status).toBe(201);
        expect(res.body.moderationStatus).toBe('pending');
        contentId = res.body.id;
    });

    it('should allow admin to see the queue', async () => {
        const res = await adminAgent.get('/api/admin/moderation/queue');

        if (!Array.isArray(res.body)) {
            console.error('Admin queue failed:', res.status, res.body);
        }

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        const item = res.body.find((c: any) => c.id === contentId);
        expect(item).toBeDefined();
        expect(item.moderationStatus).toBe('pending');
    });

    it('should allow admin to approve content', async () => {
        const res = await adminAgent
            .post(`/api/admin/moderation/${contentId}/approve`)
            .send({ note: 'Good content' });

        expect(res.status).toBe(200);
        expect(res.body.moderationStatus).toBe('approved');
        expect(res.body.moderationNote).toBe('Good content');
    });

    it('should allow admin to reject content', async () => {
        // Create another item
        const createRes = await clinicianAgent
            .post('/api/content')
            .send({
                title: 'Bad Content',
                summary: 'Summary',
                body: 'Body',
                tags: ['test']
            });
        const badId = createRes.body.id;

        const res = await adminAgent
            .post(`/api/admin/moderation/${badId}/reject`)
            .send({ reason: 'Inappropriate' });

        expect(res.status).toBe(200);
        expect(res.body.moderationStatus).toBe('rejected');
        expect(res.body.moderationNote).toBe('Inappropriate');
    });
});

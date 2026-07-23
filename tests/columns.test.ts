/* Écrire des tests avec Vitest et Supertest pour :
  * GET /api/columns
  * POST /api/columns
*/
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Column } from '../src/models/Column.js';

const app = createApp();

/**
 * Integration tests for /api/columns endpoints.
 *
 * Uses the in-memory MongoDB instance configured in tests/setup.ts.
 * A user is registered and logged in once (beforeAll) to obtain a JWT
 * token used for the protected routes (POST /api/columns).
 */
describe('Columns API', () => {
  let token: string;

  beforeAll(async () => {
    // Create a user and retrieve a JWT to access protected routes
    await request(app).post('/api/auth/register').send({
      email: 'test@visiplus.com',
      password: 'password123',
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'test@visiplus.com',
      password: 'password123',
    });

    token = loginRes.body.token ?? loginRes.body.data?.token;
  });

  describe('GET /api/columns', () => {
    it('devrait retourner un tableau vide au démarrage', async () => {
      const res = await request(app)
        .get('/api/columns')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });

    it('devrait retourner les colonnes existantes triées par position', async () => {
      await Column.create({ name: 'To Do', position: 0 });
      await Column.create({ name: 'Done', position: 1 });

      const res = await request(app)
        .get('/api/columns')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe('To Do');
      expect(res.body.data[1].name).toBe('Done');
    });

    it('devrait refuser la lecture sans authentification', async () => {
      const res = await request(app).get('/api/columns');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/columns', () => {
    it('devrait créer une nouvelle colonne (authentifié)', async () => {
      const res = await request(app)
        .post('/api/columns')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'In Progress' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.name).toBe('In Progress');
      expect(res.body.data).toHaveProperty('position');

      // Vérifie que l'insertion a bien eu lieu en base
      const inDb = await Column.findOne({ name: 'In Progress' });
      expect(inDb).not.toBeNull();
    });

    it('devrait refuser la création sans authentification', async () => {
      const res = await request(app)
        .post('/api/columns')
        .send({ name: 'Sans auth' });

      expect(res.status).toBe(401);
    });

    it('devrait refuser une colonne sans nom', async () => {
      const res = await request(app)
        .post('/api/columns')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });
});
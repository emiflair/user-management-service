// Example placeholder test using supertest
const request = require('supertest');
const app = require('../app');

describe('Health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

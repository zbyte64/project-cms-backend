const {app} = require('../../src/index');
const request = require('supertest');


describe('CMS', () => {
  describe('client', (done) => {
    it('is hosted', () => {
      request(app)
        .get('/project-cms')
        .expect(200, done);
    });
  });
});

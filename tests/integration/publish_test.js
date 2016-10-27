const {app} = require('../../src/index');
const request = require('supertest');
const userFixture = require('../user_fixture');


describe('CMS', () => {
  let token;
  beforeEach((done) => {
    userFixture().then(atoken => {
      token = atoken;
      done();
    });
  });

  describe('publish', () => {
    it('requires auth', (done) => {
      request(app)
        .post('/site/publish')
        .attach('/media/index.html', 'tests/fixtures/index.html')
        .expect(403, done);
    });

    it('accepts a form for version uplishing', (done) => {
      request(app)
        .post('/site/publish')
        .set('Authorization', token)
        .attach('/media/index.html', 'tests/fixtures/index.html')
        .expect(200, {
          Data: '\b\u0001',
          Links:
           [ { Name: '/media/index.html',
               Size: 67,
               Hash: 'QmYWBHGceRnSBqtDpVzYXSQ4Tv9AvYVbumWW5ZsEs4CHH3' } ],
          Hash: 'QmW2aoxHBXhEUZKJDik5EaV9XAcMgZmsTcemR6bnMcGLgK',
          Size: 130
        }, done);
    });
  });
});

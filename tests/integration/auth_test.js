const {app} = require('../../src/index');
const userFixture = require('../user_fixture');
const request = require('supertest');


describe('auth', () => {
  let user, token;
  beforeEach((done) => {
    userFixture().then(atoken => {
      token = atoken;
      done();
    });
  });

  describe('views', () => {
    it('responds on signup url', (done) => {
      request(app)
        .get('/auth/signup')
        .set('Accept', 'text/html')
        .expect(200, done);
    });

    it('responds on login url', (done) => {
      request(app)
        .get('/auth/login')
        .expect(200, done);
    });

    it('login rejects invalid password username combo', (done) => {
      request(app)
        .post('/auth/login')
        .send({username: 'doesnotexist', password: 'password'})
        .expect(302, done);
    });

    it('responds on logout url', (done) => {
      request(app)
        .get('/auth/logout')
        .expect(302, done);
    });

    it('responds on forgot password', (done) => {
      request(app)
        .get('/auth/forgot-password')
        .expect(200, done);
    });

    it('reset password requires signed url token', (done) => {
      request(app)
        .get('/auth/reset-password')
        .expect(400, done);
    });

    it('activate requires signed url token', (done) => {
      request(app)
        .get('/auth/activate')
        .expect(400, done);
    });
  });
});

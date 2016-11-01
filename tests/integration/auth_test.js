const {app} = require('../../src/index');
const {events} = require('../../src/integrations');
const userFixture = require('../user_fixture');
const assert = require('assert');
const request = require('supertest');


describe('auth', () => {
  let token;
  beforeEach((done) => {
    userFixture().then(atoken => {
      token = atoken;
      done();
    });
  });

  afterEach(() => {
    events.removeAllListeners();
  });

  describe('views', () => {
    it('responds on signup url', (done) => {
      request(app)
        .get('/auth/signup')
        .set('Accept', 'text/html')
        .expect(200, done);
    });

    it('signup sends activation email', (done) => {
      let sendMailEvent;
      events.once('sendMail-signup', event => {
        sendMailEvent = event;
      });

      request(app)
        .post('/auth/signup')
        .send({
          email: 'foobar@email.com',
          fullname: 'foo bar',
          password: 'foobar',
          password_confirm: 'foobar',
          agree_tos: true,
        })
        .expect(302)
        .end(function(err, res) {
          if (err) throw err;
          assert(sendMailEvent, res.headers['flash-error']);
          done();
        });
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

    it('login accepts valid credentials', (done) => {
      request(app)
        .post('/auth/login')
        .send({ username: 'user', password: 'foobar' })
        .expect(302)
        .end(function(err, res) {
          if (err) throw err;
          assert.equal(res.headers.location, "/")
          done();
        });
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

    it('forgot password looks up by username', (done) => {
      let sendMailEvent;
      events.once('sendMail-forgotPassword', event => {
        sendMailEvent = event;
      });

      request(app)
        .post('/auth/forgot-password')
        .send({username: 'user'})
        .expect(302)
        .end(function(err, res) {
          if (err) throw err;
          assert(sendMailEvent, res.headers['flash-error']);
          done();
        });
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

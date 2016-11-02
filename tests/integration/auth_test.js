const {app} = require('../../src/index');
const {events} = require('../../src/integrations');
const {generateResetUrl, generateActivateUrl, getUser} = require('../../src/models');
const {User} = require('../../src/connections');
const userFixture = require('../user_fixture');
const assert = require('assert');
const request = require('supertest');
const _ = require('lodash');


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

  describe('self', () => {
    it('responds with null for anonymous users', (done) => {
      request(app)
        .get('/auth/self')
        .expect(200, null, done);
    });

    it('responds with user info without sensitive info', (done) => {
      request(app)
        .get('/auth/self')
        .set('Authorization', token)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          let userInfo = res.body;
          assert(userInfo);
          assert(_.isUndefined(userInfo.password_hash));
          assert(_.isUndefined(userInfo.stripe_customer_id));
          assert(userInfo.id);
          done();
        });
    });
  });

  describe('signup', () => {
    it('responds with html', (done) => {
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
  });

  describe('login', () => {
    it('responds with html', (done) => {
      request(app)
        .get('/auth/login')
        .set('Accept', 'text/html')
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
  });

  describe('logout', () => {
    it('redirects to login', (done) => {
      request(app)
        .get('/auth/logout')
        .expect(302)
        .end((err, res) => {
          if (err) return done(err);
          assert.equal(res.headers.location, '/auth/login');
          done();
        });
    });
  });

  describe('forgot password', () => {
    it('responds with html', (done) => {
      request(app)
        .get('/auth/forgot-password')
        .set('Accept', 'text/html')
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
  });

  describe('reset password', () => {
    it('requires signed url token', (done) => {
      request(app)
        .get('/auth/reset-password')
        .expect(400, done);
    });

    it('renders html', (done) => {
      generateResetUrl('user').then(url => {
        let queryParams = url.split('?')[1];
        request(app)
          .get('/auth/reset-password?'+queryParams)
          .set('Accept', 'text/html')
          .expect(200, done);
      }, done);
    });
  });

  describe('activate', () => {
    before(() => {
      return User.destroy({
        where: {username: 'activeuser'}
      });
    });

    it('requires signed url token', (done) => {
      request(app)
        .get('/auth/activate')
        .expect(400, done);
    });

    it('creates active user', (done) => {
      generateActivateUrl({
        username: 'activeuser',
        password_hash: 'meh',
        email: 'activeuser@email.com',
      }).then(url => {
        let queryParams = url.split('?')[1];
        request(app)
          .get('/auth/activate?'+queryParams)
          .expect(302)
          .end(function(err, res) {
            if (err) return done(err);
            if (res.headers['flash-error']) {
              assert.fail(res.headers['flash-error'])
            }
            assert.equal(res.headers.location, '/');
            getUser('activeuser').then(user => {
              assert.equal(user.hostname.indexOf(' '), -1, "hostname contains a space");
              done();
            }).catch(done);
          });
      }, done);
    });
  });
});

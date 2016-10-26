const assert = require('assert');
const {app} = require('../src/index');
const {sync, User} = require('../src/connections');
const {createUser} = require('../src/models');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const mockStripe = require('./stripe_mock');


describe('CMS', () => {
  let user, token;
  beforeEach((done) => {
    sync().then(() => {
      user = {
        id: '97e6afa2-f2da-43b5-98d1-26b13bd91073',
        username: 'user',
        hostname: 'foobar',
        password_hash: bcrypt.hashSync('foobar', 10),
        email: 'user@email.com',
        is_active: true,
        email_confirmed: true,
      };
      return User.upsert(user);
    }).then((result) => {
      token = 'Bearer ' + jwt.sign(_.pick(user, [
        'id',
        'username',
        'email',
        'hostname',
      ]), process.env.SECRET);
      done();
    }).catch(error => {
      console.error(error)
      done(null, error);
    });
  });

  describe('signup', () => {
    it('responds on signup url', (done) => {
      request(app)
        .get('/auth/signup')
        .expect(200, done);
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

  describe('datastore', () => {
    it('requires auth', (done) => {
      request(app)
        .get('/datastore/anamespace')
        .expect(401, done);
    });

    it('returns a table listing', (done) => {
      request(app)
        .get('/datastore/anamespace')
        .set('Authorization', token)
        .expect(200, [], done);
    });
  });

  describe('billing', () => {
    it('requires auth', (done) => {
      request(app)
        .post('/billing/plan-signup')
        .expect(401, done);
    });

    it('plan signup accepts a stipe callback', (done) => {
      mockStripe()
      request(app)
        .post('/billing/plan-signup')
        .set('Authorization', token)
        .send({
          stripeToken: {
            id: 'foobar'
          }
        })
        .expect(200, {
          success: true,
          message: "Your account has been upgraded."
        }, done);
    });
  });

  describe('client', (done) => {
    it('is hosted', () => {
      request(app)
        .get('/project-cms')
        .expect(200, done);
    });
  });
});

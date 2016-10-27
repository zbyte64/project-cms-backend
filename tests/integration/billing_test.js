const {app} = require('../../src/index');
const request = require('supertest');
const mockStripe = require('../stripe_mock');
const userFixture = require('../user_fixture');


describe('CMS', () => {
  let token;
  beforeEach((done) => {
    userFixture().then(atoken => {
      token = atoken;
      done();
    });
  });

  describe('billing', () => {
    it('requires auth', (done) => {
      request(app)
        .post('/billing/plan-signup')
        .expect(401, done);
    });

    it('plan signup accepts a stripe callback', (done) => {
      mockStripe()
      request(app)
        .post('/billing/plan-signup')
        .set('Authorization', token)
        .set('Accept', 'application/json')
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
});

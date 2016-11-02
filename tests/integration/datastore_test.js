const {app} = require('../../src/index');
const {UserData} = require('../../src/connections');
const request = require('supertest');
const userFixture = require('../user_fixture');


describe('CMS', () => {
  let token;
  before(() => {
    return UserData.destroy({
      where: {_user: '97e6afa2-f2da-43b5-98d1-26b13bd91073'}
    });
  });

  beforeEach(() => {
    return userFixture().then(atoken => {
      token = atoken;
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

    it('accepts PUT data', (done) => {
      request(app)
        .put('/datastore/anamespace')
        .set('Authorization', token)
        .send([ { key: "foo", value: "bar" } ])
        .expect(200, {}, done);
    });

    it('updates PUT data', (done) => {
      request(app)
        .put('/datastore/anamespace')
        .set('Authorization', token)
        .send([ { key: "foo", value: "foobar" } ])
        .expect(200, {}, done);
    });

    it('persists data', (done) => {
      request(app)
        .get('/datastore/anamespace')
        .set('Authorization', token)
        .expect(200, [ { key: "foo", value: "foobar" } ], done);
    });

    it('accepts DELETE', (done) => {
      request(app)
        .delete('/datastore/anamespace')
        .set('Authorization', token)
        .send([ "foo" ])
        .expect(200, done);
    });

    it('deletes data', (done) => {
      request(app)
        .get('/datastore/anamespace')
        .set('Authorization', token)
        .expect(200, [], done);
    });
  });
});

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

  describe('upload', () => {
    it('requires auth', (done) => {
      request(app)
        .post('/site/upload')
        .attach('/media/image.jpg', 'tests/fixtures/image.jpg')
        .expect(403, done);
    });

    it('accepts a multipart form for uploading', (done) => {
      request(app)
        .post('/site/upload')
        .set('Authorization', token)
        .attach('/media/image.jpg', 'tests/fixtures/image.jpg')
        .expect(200, {
          "/media/image.jpg": {
            "path":"QmS9LhDFbfCkue34sp1bBQedtpesrUAyA7pkjZENYbKtNf",
            "hash":"QmS9LhDFbfCkue34sp1bBQedtpesrUAyA7pkjZENYbKtNf",
            "size":11253
          }
        }, done);
    });
  });

  describe('publish', () => {
    it('requires auth', (done) => {
      request(app)
        .post('/site/publish')
        .attach('index.html', 'tests/fixtures/index.html')
        .expect(403, done);
    });

    it('accepts a multipart form for version publishing', (done) => {
      request(app)
        .post('/site/publish')
        .set('Authorization', token)
        .attach('index.html', 'tests/fixtures/index.html')
        .expect(200, {
          Data: '\b\u0001',
          Links: [
            {
              "Hash": "QmS9LhDFbfCkue34sp1bBQedtpesrUAyA7pkjZENYbKtNf",
              "Name": "/media/image.jpg",
              "Size": 11253
            },
            {
              Name: 'index.html',
              Size: 67,
              Hash: 'QmYWBHGceRnSBqtDpVzYXSQ4Tv9AvYVbumWW5ZsEs4CHH3'
            }
          ],
          Hash: 'QmR5kRx53BJme5G2wuGUsR4uve7DQz7hKh5cqMxk3VF2bM',
          Size: 11435
        }, done);
    });
  });
});

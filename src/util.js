var _ = require('lodash');
var bcrypt = require('bcryptjs');
var querystring = require('querystring');
var jwt = require('jsonwebtoken');


//bcrypt hasher that returns a promise
function doHash(password) {
  return new Promise(function(resolve, reject) {
    bcrypt.hash(password, 10, function(err, hash) {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
}
exports.doHash = doHash;


var DEFAULT_EXPIRATION = '3 days';
function signedParams(params, expiresIn=DEFAULT_EXPIRATION, secret=process.env.SECRET) {
  return new Promise(function(resolve, reject) {
    jwt.sign(params, secret, {
      expiresIn: expiresIn
    }, function(err, token) {
      if (err) {
        reject(err);
      } else {
        resolve(querystring.encode({ token }));
      }
    });
  });
}
exports.signedParams = signedParams;

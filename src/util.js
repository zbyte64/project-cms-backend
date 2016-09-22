var _ = require('lodash');
var bcrypt = require('bcryptjs');
var querystring = require('querystring');
var jwt = require('jsonwebtoken');


//bcrypt hasher that returns a promise
function doHash(password) {
  return new Promise(function(resolve, reject) {
    bcrypt.hash(password, 10, function(err, hash) {
      console.log("hash response", arguments, password)
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
}
exports.doHash = doHash;


var DEFAULT_EXPIRATION = 60*24*3; //3 Days
function signedParams(params, expiresIn=DEFAULT_EXPIRATION, secret=process.env.SECRET) {
  console.log("generating hash of:", params);

  var token = jwt.sign(params, secret, {
    expiresInMinutes: expiresIn
  });
  return querystring.encode({token});
}
exports.signedParams = signedParams;

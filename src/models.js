var r = require('rethinkdb');
var {runQuery, ServerUrl} = require('./connections');
var {sendMail} = require('./integrations');
var {signedParams} = require('./util');


function getUser(username) {
  return runQuery(r.table('users').filter(r.row('username').eq(username)));
}
exports.getUser = getUser;

function getUserById(user_id) {
  return runQuery(r.table('users').get(user_id));
}
exports.getUserById = getUserById;

function createUser(userDoc) {
  return runQuery(r.table('users').insert([userDoc])).then(response => {
    sendMail({
      email: userDoc.email,
      action: 'newUser',
      properties: _.merge({
        url: generateActivateUrl(userDoc.username),
      }, userDoc),
    });
  })
}
exports.createUser = createUser;

function updateUser(user_id, userDoc) {
  return runQuery(r.table('users').get(user_id).update(userDoc));
}
exports.updateUser = updateUser;

//generates a signed url for reseting a password
function generateResetUrl(username, ...args) {
  var q = signedParams({username}, ...args);
  return `${ServerUrl}/auth/reset-password?${q}`;
}
exports.generateResetUrl = generateResetUrl;

//generates a signed url for activating
function generateActivateUrl(username, ...args) {
  var q = signedParams({username}, ...args);
  return `${ServerUrl}/auth/activate?${q}`;
}
exports.generateActivateUrl = generateActivateUrl;

var {r, ServerUrl} = require('./connections');
var {sendMail} = require('./integrations');
var {signedParams} = require('./util');


function getUser(username) {
  return r.table('users').filter(r.row('username').eq(username)).run();
}
exports.getUser = getUser;

function getUserById(user_id) {
  return r.table('users').get(user_id).run();
}
exports.getUserById = getUserById;

function createUser(userDoc) {
  return r.table('users').insert([userDoc]).run().then(response => {
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
  return r.table('users').get(user_id).update(userDoc).run();
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

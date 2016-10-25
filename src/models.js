var {User, ServerUrl} = require('./connections');
var {sendMail} = require('./integrations');
var {signedParams} = require('./util');
var bip39 = require('bip39');


function generateHostname() {
  return bip39.generateMnemonic(32).replace(' ', '-');
}
exports.generateHostname = generateHostname;


function getUser(username) {
  return User.findAll({
    where: {username},
    limit: 1,
  }).then(c => {
    if (!c || !c.length) Promise.reject(new Error("User not found"))
    return c[0]
  });
}
exports.getUser = getUser;

function getUserById(user_id) {
  return User.findAll({
    where: {id: user_id},
    limit: 1,
  }).then(c => {
    if (!c || !c.length) Promise.reject(new Error("User not found"))
    return c[0]
  });
}
exports.getUserById = getUserById;

function createUser(userDoc) {
  //TODO use joi for validation?
  if (!userDoc.username) throw new Error("User document must specify a username");
  if (!userDoc.email) throw new Error("User document must specify an email")
  if (!userDoc.hostname) userDoc.hostname = generateHostname()
  return User.create(userDoc).then(user => {
    sendMail({
      email: user.email,
      action: 'newUser',
      properties: _.merge({
        url: generateActivateUrl(user.username),
      }, user),
    });
    return user;
  });
}
exports.createUser = createUser;

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

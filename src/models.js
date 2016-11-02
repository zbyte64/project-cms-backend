const {User, ServerUrl} = require('./connections');
const {sendMail} = require('./integrations');
const {signedParams} = require('./util');
const bip39 = require('bip39');


function generateHostname() {
  return bip39.generateMnemonic(32).replace(' ', '-');
}
exports.generateHostname = generateHostname;


function getUser(username) {
  return User.findOne({
    where: {username},
  }).then(c => {
    if (!c) return Promise.reject(new Error("User not found"))
    return c
  });
}
exports.getUser = getUser;

function getUserById(user_id) {
  return User.findById( user_id ).then(c => {
    if (!c) return Promise.reject(new Error("User not found"))
    return c
  });
}
exports.getUserById = getUserById;

function createUser(userDoc) {
  //TODO use joi for validation?
  if (!userDoc.email) throw new Error("User document must specify an email");
  if (!userDoc.username) userDoc.username = userDoc.email;
  if (!userDoc.hostname) userDoc.hostname = generateHostname();
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

function createActiveUser(userDoc) {
  //TODO use joi for validation?
  if (!userDoc.email) throw new Error("User document must specify an email");
  if (!userDoc.password_hash) throw new Error("Active user document must specify a password hash");
  if (!userDoc.username) userDoc.username = userDoc.email;
  if (!userDoc.hostname) userDoc.hostname = generateHostname();
  userDoc.is_active = true;
  userDoc.email_confirmed = true;
  return User.create(userDoc);
}
exports.createActiveUser = createActiveUser;

//generates a signed url for reseting a password
function generateResetUrl(username, ...args) {
  return signedParams({username}, ...args)
    .then(q => `${ServerUrl}/auth/reset-password?${q}`)
}
exports.generateResetUrl = generateResetUrl;

//generates a signed url for activating, params become user fields
function generateActivateUrl(params, ...args) {
  return signedParams(params, ...args)
    .then(q =>`${ServerUrl}/auth/activate?${q}`);
}
exports.generateActivateUrl = generateActivateUrl;

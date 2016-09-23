var {r, ServerUrl} = require('./connections');
var {sendMail} = require('./integrations');
var {signedParams} = require('./util');
var bip39 = require('bip39');


function generateHostname() {
  return bip39.generateMnemonic(32).replace(' ', '-');
}
exports.generateHostname = generateHostname;


function getUser(username) {
  return r.table('users').filter({username}).limit(1).run().then(c => c.next());
}
exports.getUser = getUser;

function getUserById(user_id) {
  return r.table('users').get(user_id).run().then(x => x ? x : Promise.reject(new Error("User not found")))
}
exports.getUserById = getUserById;

function createUser(userDoc) {
  //TODO use joi for validation?
  if (!userDoc.username) throw new Error("User document must specify a username");
  if (!userDoc.email) throw new Error("User document must specify an email")
  if (!userDoc.hostname) userDoc.hostname = generateHostname()
  return r.table('users').insert([userDoc]).run().then(response => {
    let userId = response.generated_keys[0];
    let user = _.merge({id: userId}, userDoc);
    sendMail({
      email: user.email,
      action: 'newUser',
      properties: _.merge({
        url: generateActivateUrl(user.username),
      }, user),
    });
    return user;
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

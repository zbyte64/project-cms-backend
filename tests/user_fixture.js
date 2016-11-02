const {sync, User} = require('../src/connections');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const _ = require('lodash');


module.exports = function() {
  return sync().then(() => {
    user = {
      id: '97e6afa2-f2da-43b5-98d1-26b13bd91073',
      username: 'user',
      hostname: 'foobar',
      password_hash: bcrypt.hashSync('foobar', 10),
      email: 'user@email.com',
      is_active: true,
      email_confirmed: true,
      stripe_customer_id: null,
    };
    return User.upsert(user);
  }).then((result) => {
    return 'Bearer ' + jwt.sign(user, process.env.SECRET);
  }).catch(error => {
    console.error(error);
    return Promise.reject(error);
  });
}

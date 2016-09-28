const _ = require('lodash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const {getUser, getUserById} = require('../models');
const {emitEvent} = require('../integrations');


//authentication strategy
passport.use('login', new LocalStrategy(function(username, password, done) {
  getUser(username).then(user => {
    bcrypt.compare(password, user.password_hash, function(err, res) {
      if (err) return done(err);
      if (res)  {
        emitEvent('login', {email: user.email});
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect Login' });
      }
    });
  }, notFound => {
    return done(null, false, { message: 'Incorrect Login'});
  });
}));

passport.serializeUser(function(user, done) {
  console.log('serializeUser: ' + user.id)
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  getUserById(id).then(user => {
    done(null, user);
  }, notFound => {
    done(notFound, null)
  });
});

exports.passport = passport;

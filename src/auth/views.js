const _ = require('lodash');
const flash = require('connect-flash');
const express = require('express');

const {doHash} = require('../util');
const {passport} = require('./common');
const {validateRegistrationSchema, validateForgotPasswordSchema, validateResetPasswordSchema} = require('./schemas');
const {authorize, signedUsername} = require('./middleware');
const {getUser, createActiveUser, generateResetUrl, generateActivateUrl} = require('../models');
const {sendMail, emitEvent} = require('../integrations');


var auth = express();
exports.auth = auth;

auth.use(authorize);
auth.use(flash());
auth.use(noCache);

function noCache(req, res, next) {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Expires", "0");
  next();
}

function flashError(req) {
  let error = req.flash('error');
  if (error && error.length) return error;
  return null;
}

function flashContext(req) {
  let error = req.flash('error');
  let success = req.flash('success');
  let context = {};
  if (error && error.length) context.errors = error;
  if (success && success.length) context.message = success;
  req.session.flash = [];
  return context;
}


auth.get('/self', function(req, res) {
  var info = _.omit(req.user, 'password_hash', 'stripe_customer_id');
  info.has_paid = req.user.stripe_customer_id ? true : false;
  res.send(info);
});

auth.get('/login', function(req, res) {
  res.send(flashContext(req));
});

auth.post('/login',
  passport.authenticate('login',{successRedirect: '/',
                                 failureRedirect: '/auth/login',
                                 failureFlash: true }));

auth.get('/logout', function(req, res) {
  if (req.user) {
    emitEvent('logout', {email: req.user.email});
    req.logout();
  }
  res.redirect('/auth/login');
});

auth.get('/signup', function(req, res) {
  res.send(flashContext(req));
});

auth.post('/signup', function(req, res) {
  validateRegistrationSchema(req.body).then(params => {
    return generateActivateUrl(params).then(url => {
      return sendMail({
        email: params.email,
        action: 'signup',
        properties: _.merge(params, { url }),
      });
    });
  }).then(() => {
    //display check your email
    req.flash('success', 'check your email');
    return res.redirect('/auth/signup');
  }).catch(error => {
    req.flash('error', error.toString());
    return res.redirect('/auth/signup');
  });
});


auth.get('/forgot-password', function(req, res) {
  res.send(flashContext(req));
});

auth.post('/forgot-password', function(req, res) {
  validateForgotPasswordSchema(req.body).then(params => {
    console.log("forgot password for:", params.username);

    return getUser(params.username)
  }).then(user => {
    //console.log("found user:", user);
    return generateResetUrl(user.username).then(url => {
      console.log("password reset requested:", url);
      return sendMail({
        email: user.email,
        action: 'forgotPassword',
        properties: {
          url: url
        }
      });
    });
  }).then(info => {
    req.flash('success', 'Check your email');
    res.redirect('/auth/forgot-password');
    console.log("sent link to set password");
  }).catch(error => {
    req.flash('error', error.toString());
    res.redirect('/auth/forgot-password');
  });
});


auth.get('/activate', signedUsername, function(req, res) {
  createActiveUser(req.tokenParams).then(user => {
    req.login(user, function(err) {
      if (err) {
        console.error("Could not login")
        console.error(err);
        req.flash('error', err.toString());
        res.redirect('/auth/login');
        return;
      }
      emitEvent('login', {email:user.email});
      res.redirect('/');
    });
  }, error => {
    req.flash('error', err.toString());
    res.redirect('/auth/login');
  });
});


auth.get('/reset-password', signedUsername, function(req, res) {
  let context = flashContext(req);
  context.username = req.tokenParams.username;
  res.send(context);
});

auth.post('/reset-password', signedUsername, function(req, res, next) {
  let foundUser;
  return validateResetPasswordSchema(req.body).then(params => {
    let userPromise = getUser(req.tokenParams.username);
    let pwPromise = doHash(params.password);
    return Promise.all([userPromise, pwPromise])
  }).then(([user, password_hash]) => {
    foundUser = user;
    user.email_confirmed = true;
    user.password_hash = password_hash;
    return user.save();
  }).then(() => {
    req.flash('success', 'password set');
    res.redirect('/auth/login');
    emitEvent('password-reset', {email: foundUser.email});
  }).catch(error => {
    req.flash('error', error.toString());
    res.redirect('/auth/reset-password');
  });
});

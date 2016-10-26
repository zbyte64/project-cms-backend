const _ = require('lodash');
const flash = require('connect-flash');
const express = require('express');

const {doHash} = require('../util');
const {passport} = require('./common');
const {authorize, signedUsername} = require('./middleware');
const {getUser, createUser, generateResetUrl, generateActivateUrl} = require('../models');
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


auth.get('/self', function(req, res) {
  var info = _.omit(req.user, 'password_hash', 'customer_id');
  info.has_paid = req.user.customer_id ? true : false;
  res.send(info);
});

auth.get('/login', function(req, res) {
  res.send({errors: req.flash('error')});
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
  res.send({errors: req.flash('error')});
});

//pumps to footer signup
auth.post('/signup', function(req, res) {
  if (!req.body.first_name) {
    req.flash('error', 'first name is required');
    return res.redirect('/auth/signup');
  }
  //if (!req.body.last_name) return res.status(400).send('last_name is required');
  if (!req.body.email) {
    req.flash('error', 'email is required');
    return res.redirect('/auth/signup');
  }
  //if (!req.body.template) return res.status(400).send('template is required');

  var params = _.pick(req.body, ['first_name', 'last_name', 'email']);

  //signed url for /auth/footer-activate
  sendMail({
    email: req.body.email,
    action: 'signup',
    properties: _.merge(params, {
      url: generateActivateUrl(params)
    }),
  });
  //display check your email
  res.send({message: 'check your email', success: true});
});


auth.get('/forgot-password', function(req, res) {
  res.send({errors: req.flash('error')});
  req.session.flash = [];
});

auth.post('/forgot-password', function(req, res) {
  if (!req.body || !req.body.username) {
    req.flash('error', 'Username is required');
    res.redirect('/auth/forgot-password');
    return;
  }
  console.log("forgot password for:", req.body.username);

  getUser(req.body.username).then(user => {
    console.log("found user:", user);
    var url = generateResetUrl(user.username);
    console.log("password reset requested:", url);
    return sendMail({
      email: user.email,
      action: 'forgotPassword',
      properties: {
        url: url
      }
    }).then(info => {
      req.flash('success', 'Check your email');
      res.redirect('/auth/forgot-password');
      console.log("sent link to set password");
    }, error => {
      req.flash('error', 'Error sending email: '+error);
      res.redirect('/auth/forgot-password');
    });
  }, error => {
    req.flash('error', 'Invalid Username');
    res.redirect('/auth/forgot-password');
  });
});



//meh
function setPassword(req, res, next) {
  if (!req.body || !req.body.password) return res.sendStatus(400);
  var password = req.body.password;
  var username = req.tokenParams.username;

  return getUser(username).then(user => {
    console.log("setting user password:", username);
    return doHash(password).then(hash => {
      console.log("new hash:", hash);
      user.password_hash = hash;
      user.email_confirmed = true;
      user.is_active = true;
      console.log("push user:", user);
      return user.save().then(response => {
        console.log("password saved", response);
        req.login(user, function(err) {
          if (err) {
            console.error("Could not login")
            console.error(err);
            //res.status(500).send(err)
            return;
          }
          emitEvent('login', {email:user.email});
          next();
        });
        return user;
      }, error => {
        console.error("Could not save password")
        console.error(error)
        res.status(500).send(err)
      });
    });
  }, notFound => {
    res.status(400);
  });
}

function setPasswordWithEvent(eventName) {
  return function(req, res, next) {
    setPassword(req, res, next).then(user => {
      emitEvent(eventName, {email:user.email});
    });
  }
}

//activate == reset but with different templates

auth.get('/activate', signedUsername, function(req, res) {
  res.send({
    username: req.query.username,
    errors: req.flash('error'),
  });
});

auth.post('/activate', signedUsername, function(req, res, next) {
    if (!req.body || !req.body.password || req.body.password !== req.body.password_confirm) {
      req.flash('error', 'Passwords do not match')
      res.redirect('/auth'+req.url);
    } else {
      next();
    }
  }, setPasswordWithEvent('account-activated'), function(req, res) {
    res.redirect('/');
});

auth.get('/reset-password', signedUsername, function(req, res) {
  res.send({
    username: req.tokenParams.username,
    messages: req.flash('error'),
  });
});

auth.post('/reset-password', signedUsername, function(req, res, next) {
    if (!req.body || !req.body.password || req.body.password !== req.body.password_confirm) {
      req.flash('error', 'Passwords do not match')
      res.redirect('/auth'+req.url);
    } else {
      next();
    }
  }, setPasswordWithEvent('reset-password-success'), function(req, res) {
    res.redirect('/');
});

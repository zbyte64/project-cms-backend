const _ = require('lodash');
const querystring = require('querystring');
const jwt = require('jsonwebtoken');
const cookieSession = require("cookie-session");
const cookieParser = require('cookie-parser');
const jwtMiddleware = require('express-jwt');
const {passport} = require('./common');


var PROVISIONAL = false; //ie dev is true
if (!process.env.SECRET) {
  console.warn("You must set SECRET")
  //throw new Error();
  process.env.SECRET = 'au7ChaenSe2eiv4pvoofooC1';
  PROVISIONAL = true;
}


/*
var sessionConfig = {
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    name: "cookie-name-goes-here",
    signed: true
};
var configuredSessionMiddleware = cookieSession(sessionConfig);
*/

const sessionStore = cookieSession({
  secret: process.env.SECRET,
  //httpOnly: false, //this allows javascript to read session info!
  cookie: {maxAge: 60 * 60}
});


function getUserData(userId) {
  return new Promise(function(resolve, reject){
    if (userId === null) {
      //how does passport handle anonymous users?
      return resolve(null);
    }
    passport.deserializeUser(userId, function(err, user) {
        if (err) { return reject(err);}
        if (!user) { return reject("User not found"); }
        //only pass what is absolutely needed, must fit in cookie
        resolve(user);
    });
  });
};


function chainMiddleware(...mfuncs) {
  //wrap up a list of middleware as one middleware
  return function(req, res, next) {
    let _tick = 0;
    function tick() {
      if (_tick >= _.size(mfuncs)) {
        next();
      } else {
        var mw = mfuncs[_tick];
        _tick += 1;
        mw(req, res, tick);
      }
    }
    tick();
  }
}

function varyByCookie(req, res, next) {
  res.setHeader("Vary", "Cookie");
  next();
}

const cookieAuthorize = chainMiddleware(
  varyByCookie,
  cookieParser(),
  sessionStore,
  passport.initialize(),
  passport.session()
)

const authorize = chainMiddleware(
  jwtMiddleware({
    secret: process.env.SECRET,
    credentialsRequired: false,
  }),
  (req, res, next) => {
    if (req.user) return next();
    cookieAuthorize(req, res, next);
  }
)


function signedToken(req, res, next) {
  /* Parse and validate token GET param */
  if (PROVISIONAL) {
    return next();
  }
  var q = req.query;
  if (!q.token) {
    return res.status(400).send('No Token');
  }

  jwt.verify(q.token, process.env.SECRET, function(err, payload) {
    if (err) {
      return res.status(400).send(err);
    }
    req.tokenParams = payload;
    return next();
  });
}

//middleware for a url signed username
function signedUsername(req, res, next) {
  signedToken(req, res, function() {
    if (!req.tokenParams.username) {
      return res.status(400).send('No Username');
    }
    next();
  });
}

exports.authorize = authorize;
exports.signedToken = signedToken;
exports.signedUsername = signedUsername;

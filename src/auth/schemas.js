const Joi = require('joi');
const _ = require('lodash');
const { doHash } = require('../util');


function validationFactory(schema, value, options) {
  /* Promisified Joi.validate */
  return new Promise(function(resolve, reject) {
    Joi.validate(value, schema, options, (err, sanitizedValue) => {
      if (err) return reject(err);
      return resolve(sanitizedValue);
    });
  });
}

const registrationSchema = Joi.object().keys({
  username: Joi.string().min(6).max(40),
  email: Joi.string().email().required(),
  fullname: Joi.string().min(3).max(60).required(),
  password: Joi.string().min(6).required(),
  agree_tos: Joi.boolean().required(),
});

exports.validateRegistrationSchema = function(value, options) {
  /* convert password into password_hash */
  return validationFactory(registrationSchema, value, options).then(registrationForm => {
    return doHash(registrationForm.password).then(password_hash => {
      registrationForm.password_hash = password_hash;
      delete registrationForm.password;
      return registrationForm;
    })
  });
}


const forgotPasswordSchema = Joi.object().keys({
  username: Joi.string().required(),
});

exports.validateForgotPasswordSchema = _.partial(validationFactory, forgotPasswordSchema);


const resetPasswordSchema = Joi.object().keys({
  password: Joi.string().min(6).required(),
  password_confirm: Joi.any().required().valid(Joi.ref('password')),
})//.assert('password', Joi.ref('password_confirm'), 'passwords must match');

exports.validateResetPasswordSchema = _.partial(validationFactory, resetPasswordSchema);

const _ = require('lodash');
const express = require('express');

const {stripeClient} = require('./connections');
const {emitEvent} = require('./integrations');
const {authorize} = require('./auth/middleware');


const stripePlan = process.env.STRIPE_PLAN;
//var stripePrice = process.env.STRIPE_PRICE;

var billing = express();
exports.billing = billing;
billing.use(authorize);

billing.post('/plan-signup', function(req, res) {
  if (!req.user) {
    return res.status(403).join({
      success: false,
      message: 'Must login first',
    });
  }
  let user = req.user;
  let stripeToken = req.data.stripeToken;
  console.log("charge", stripeToken);
  if (!stripeToken) {
    return res.status(400).json({
      success: false,
      message: 'No Stripe Token',
    });
  }
  let email = stripeToken.email;
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'No email sent with stripeToken'
    });
  }

  stripeClient.customers.create({
    card: stripeToken.id,
    email: email,
    plan: stripePlan,
  }, function (err, customer) {
    if (err) {
      console.log("Stripe Error:", err);
      emitEvent("stripe-error", {email, error: err});
      var msg = err.message || "unknown";
      return res.status(500).json({
        success: false,
        message: "Error while processing your payment: " + msg
      });
    } else {
      let customer_id = customer.id;
      console.log('Success! Customer with Stripe ID ' + id + ' just signed up!');
      emitEvent("stripe-success", {email, customerId: id});
      //charge success
      //upgrade user

      user.stripe_customer_id = customer_id;
      user.save();
      return res.status(200).json({
        success: true,
        message: "Your account has been upgraded."
      });
    }
  });
});

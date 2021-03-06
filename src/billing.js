const _ = require('lodash');
const express = require('express');

const {stripeClient, User} = require('./connections');
const {emitEvent} = require('./integrations');


const stripePlan = process.env.STRIPE_PLAN;
//var stripePrice = process.env.STRIPE_PRICE;

var billing = express();
exports.billing = billing;

billing.post('/plan-signup', function(req, res) {
  console.log("plan signup user:", req.user);
  if (!req.user) {
    return res.status(401).send({
      success: false,
      message: 'Must login first',
    });
  }
  if (!req.body) {
    return res.status(400).send({
      success: false,
      message: 'No Data',
    });
  }
  let user = req.user;
  if (user.stripe_customer_id) {
    return res.status(400).send({
      success: false,
      message: 'Already have a stripe customer id',
    });
  }
  let email = user.email;
  let stripeToken = req.body.stripeToken;
  console.log("charge", stripeToken);
  if (!stripeToken || !stripeToken.id) {
    return res.status(400).send({
      success: false,
      message: 'No Stripe Token',
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
      return res.status(500).send({
        success: false,
        message: "Error while processing your payment: " + msg
      });
    } else {
      let customer_id = customer.id;
      console.log('Success! Customer with Stripe ID ' + customer_id + ' just signed up!');
      emitEvent("stripe-success", {email, customerId: customer_id});
      //charge success
      //upgrade user

      User.update({
        stripe_customer_id: customer_id
      }, {
        fields: ['stripe_customer_id'],
        where: {id: user.id}
    }).then(userUpdated => {
        return res.status(200).send({
          success: true,
          message: "Your account has been upgraded."
        });
      }).catch(error => {
        res.send(error);
      });
    }
  });
});

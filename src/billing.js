const _ = require('lodash');
const express = require('express');

const {stripeClient} = require('./connections');
const {emitEvent} = require('./integrations');
const {authorize} = require('./auth/middleware');
const {createUser, updateUser} = require('./models');


const stripePlan = process.env.STRIPE_PLAN;
//var stripePrice = process.env.STRIPE_PRICE;

var billing = express();
exports.billing = billing;
billing.use(authorize);

billing.post('/plan-signup', function(req, res) {
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
      //create paid user or upgrade user
      if (req.user) {
        //upgrade user
        let userDoc = req.user;
        userDoc.customer_id = customer_id;
        updateUser(userDoc.id, userDoc)
        return res.status(200).json({
          success: true,
          message: "Your account has been upgraded."
        })
      } else {
        //create paid user
        let userDoc = {
          username: req.body.username,
          email: req.body.email,
          customer_id: customer_id,
        }
        //CONSIDER: do we need to send a verification email if they have paid?
        createUser(userDoc)
        return res.status(200).json({
          success: true,
          message: "Please check your email to set your password."
        })
      }
    }
  });
});

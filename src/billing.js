var _ = require('lodash');
var {stripeClient} = require('./connections');
var {emitEvent} = require('./integrations');


var stripePlan = process.env.STRIPE_PLAN;
//var stripePrice = process.env.STRIPE_PRICE;


function charge(req, res, next) {
  var stripeToken = req.data.stripeToken;
  console.log("charge", stripeToken);
  if (!stripeToken) {
    return res.status(400).json({
      success: false,
      message: 'No Stripe Token',
    });
  }
  var email = stripeToken.email;
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
      var id = customer.id;
      console.log('Success! Customer with Stripe ID ' + id + ' just signed up!');
      emitEvent("stripe-success", {email, customerId: id});
      next()
    }
  });
}

exports.charge = charge;

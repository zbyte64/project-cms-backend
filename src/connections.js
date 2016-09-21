var stripe = require('stripe');

//TODO process.env configurable
var r = require('rethinkdbdash')({
  port: 29015,
  host: 'rethinkdb',
});
exports.r = r;

function makeStripeClient() {
  //read credentials from environ
  return stripe(process.env.STRIPE_API_KEY);
}

var stripeClient = makeStripeClient();

exports.makeStripeClient = makeStripeClient;
exports.stripeClient = stripeClient;
exports.getRDBConnection = getRDBConnection;
exports.runQuery = runQuery;

const ServerUrl = process.env.SERVER_URL
  ? process.env.SERVER_URL
  : `http://${process.env.MAKER_PORT_8000_ADDR}:${process.env.MAKER_PORT_8000_PORT}`;
exports.ServerUrl = ServerUrl;

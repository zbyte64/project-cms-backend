var stripe = require('stripe');
var rdb = require('rethinkdb');


var connection = null;

function getRDBConnection() {
  if (!connection) {
    return new Promise(function(resolve, reject) {
      //TODO load from process.env.RETHINKDB_CONNECTION, also TLS!
      r.connect( {host: 'rethinkdb', port: 28015}, function(err, conn) {
          if (err) {
            reject(err)
          } else {
            connection = conn;
            resolve(connection);
          }
      });
    });
  } else {
    return Promise.resolve(connection);
  }
}

function runQuery(expression) {
  return getRDBConnection().then(conn => {
    return new Promise(function(resolve, reject) {
      expression.run(conn, function(err, cursor) {
        if (err) return reject(err);
        resolve(cursor);
      })
    })
  });
}

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

const stripe = require('stripe');
const _ = require('lodash')

//TODO process.env configurable
const r = require('rethinkdbdash')({
  port: 29015,
  host: 'rethinkdb',
});
exports.r = r;

const USER_TABLE_INDEX = 'userAndTable';
exports.USER_TABLE_INDEX = USER_TABLE_INDEX;

function init_database() {
  return r.tableList().run().then(tableNames => {
    if (_.indexOf(tableNames, 'userdata') !== -1) {
      //pass
    } else {
      return r.createTable('userdata').run().then(success => {
        return r.table('userdata').createIndex(USER_TABLE_INDEX, [r.row('_user'), r.row('_tableName')]).run()
      })
    }
  }).catch(error => {
    console.log("Error initializing database:");
    console.error(error);
  });
}
init_database();

function makeStripeClient() {
  //read credentials from environ
  return stripe(process.env.STRIPE_API_KEY);
}

const stripeClient = makeStripeClient();

exports.makeStripeClient = makeStripeClient;
exports.stripeClient = stripeClient;
exports.getRDBConnection = getRDBConnection;
exports.runQuery = runQuery;

const ServerUrl = process.env.SERVER_URL
  ? process.env.SERVER_URL
  : `http://${process.env.MAKER_PORT_8000_ADDR}:${process.env.MAKER_PORT_8000_PORT}`;
exports.ServerUrl = ServerUrl;

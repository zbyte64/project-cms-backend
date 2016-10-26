const stripe = require('stripe');
const _ = require('lodash');
const Sequelize = require('sequelize');
const uuid = require('uuid');
const syncPublisher = require('./publisher').sync;
const sequelize = new Sequelize(process.env.DATABASE_URL);


exports.sequelize = sequelize;

var User = sequelize.define('user', {
  id: { type: Sequelize.UUID, primaryKey: true, default: uuid.v4 },
  username: { type: Sequelize.STRING, unique: true },
  email: Sequelize.STRING,
  password_hash: Sequelize.STRING,
  hostname: { type: Sequelize.STRING, unique: true },
  is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  email_confirmed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  stripe_customer_id: Sequelize.STRING,
});

var UserData = sequelize.define('userdata', {
  id: { type: Sequelize.UUID, primaryKey: true },
  _user: Sequelize.STRING,
  _tableName: Sequelize.STRING,
  key: Sequelize.STRING,
  value: Sequelize.TEXT,
}, {
  indexes: [{
    name: 'user_and_table',
    fields: ['_user', '_tableName'],
  }]
});

exports.User = User;
exports.UserData = UserData;

function makeStripeClient() {
  //read credentials from environ
  return stripe(process.env.STRIPE_API_KEY);
}

const stripeClient = makeStripeClient();

exports.makeStripeClient = makeStripeClient;
exports.stripeClient = stripeClient;

const ServerUrl = process.env.SERVER_URL
  ? process.env.SERVER_URL
  : `http://${process.env.MAKER_PORT_8000_ADDR}:${process.env.MAKER_PORT_8000_PORT}`;
exports.ServerUrl = ServerUrl;


function sync() {
  return Promise.all([sequelize.sync(), syncPublisher()]);
}
exports.sync = sync;

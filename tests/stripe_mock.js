const nock = require('nock');


const newCustomerResponse = {
  "id": "cus_9Ru7bPDLJ9vAKm",
  "object": "customer",
  "account_balance": 0,
  "created": 1477522561,
  "currency": "usd",
  "default_source": "card_1990JR2eZvKYlo2CCXGEiIkG",
  "delinquent": false,
  "description": null,
  "discount": null,
  "email": "someone@gmail.com",
  "livemode": false,
  "metadata": {
  },
  "shipping": null,
  "sources": {
    "object": "list",
    "data": [
      {
        "id": "card_1990JR2eZvKYlo2CCXGEiIkG",
        "object": "card",
        "address_city": null,
        "address_country": null,
        "address_line1": null,
        "address_line1_check": null,
        "address_line2": null,
        "address_state": null,
        "address_zip": null,
        "address_zip_check": null,
        "brand": "Visa",
        "country": "US",
        "customer": "cus_9Ru7bPDLJ9vAKm",
        "cvc_check": "pass",
        "dynamic_last4": null,
        "exp_month": 7,
        "exp_year": 2019,
        "funding": "credit",
        "last4": "4242",
        "metadata": {
        },
        "name": null,
        "tokenization_method": null
      }
    ],
    "has_more": false,
    "total_count": 1,
    "url": "/v1/customers/cus_9Ru7bPDLJ9vAKm/sources"
  },
  "subscriptions": {
    "object": "list",
    "data": [

    ],
    "has_more": false,
    "total_count": 0,
    "url": "/v1/customers/cus_9Ru7bPDLJ9vAKm/subscriptions"
  }
};


function mockStripe() {
  return nock('https://api.stripe.com')
    .post('/v1/customers')
    .reply(200, newCustomerResponse);
}

module.exports = mockStripe;

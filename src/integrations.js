const EventEmitter = require('events');


const events = new EventEmitter();

function emitEvent(event, params) {
  console.log("Event:", event, params);
  events.emit(event, params);
}

function sendMail({email, action, properies}) {
  console.log("Send mail:", action, email);
  properties.email = email;
  events.emit(`sendMail-${action}`, properies);
  return Promise.resolve("[FAKED] email sent");
}

exports.events = events;
exports.emitEvent = emitEvent;
exports.sendMail = sendMail;

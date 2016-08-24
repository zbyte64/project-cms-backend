
function emitEvent(event, params) {
  console.log("Event:", event, params);
}

function sendMail({email, action, properies}) {
  console.log("Send mail:", action, email);
}

exports.emitEvent = emitEvent;
exports.sendMail = sendMail;

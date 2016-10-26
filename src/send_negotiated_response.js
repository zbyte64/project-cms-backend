const _ = require('lodash');


function contentNegotiatedSend(originalSend, req, res, payload) {
  //TODO if payload is error...
  if (req.accepts('html')) {
    let view = req.path.substr(1) + '.html';
    return res.render(view, payload);
  }
  if (req.accepts('json')) {
    return res.json(payload);
  }
  originalSend(payload);
}

function contentNegotiatedSendMiddleware(req, res, next) {
  req.send = _.partial(contentNegotiatedSend, req.send, req, res);
  next();
}

module.exports = contentNegotiatedSendMiddleware;

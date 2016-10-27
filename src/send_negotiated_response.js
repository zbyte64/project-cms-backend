const _ = require('lodash');
const {response} = require('express');
const nunjucks = require('nunjucks');
const path = require('path');


const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(path.resolve(__dirname, '../views/')),
  { autoescape: false }
);


function errorHandler(req, res, error) {
  console.error(error);
  res.status(500);
  response.send.call(res, "error");//error.toString());
}

function contentNegotiatedSend(req, res, payload) {
  //console.log("negotiating:", payload, req.headers)
  if (_.isString(payload)) {
    return response.send.call(res, payload);
  }
  if (payload instanceof Error) {
    return errorHandler(req, res, payload);
  }
  if (req.accepts('html')) {
    let view = (req.baseUrl + req.path).substr(1) + '.html';
    try {
      env.render(view, payload, (error, renderedContent) => {
        if (error) {
          errorHandler(req, res, error);
        } else {
          response.send.call(res, renderedContent);
        }
      });
      return
      //return res.render(view, payload);
    } catch (error) {
      return errorHandler(req, res, error);
    }
  }
  if (req.accepts('json')) {
    return res.json(payload);
  }
  return response.send.call(res, payload);
}

function contentNegotiatedSendMiddleware(req, res, next) {
  res.send = _.partial(contentNegotiatedSend, req, res);
  next();
}

module.exports = contentNegotiatedSendMiddleware;

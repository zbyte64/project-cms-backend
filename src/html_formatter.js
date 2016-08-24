var nunjucks = require('nunjucks');


const VIEWS_DIRECTORY = __dirname + "/../views"
nunjucks.configure(VIEWS_DIRECTORY);

//for use with text/html
function formatHTML(req, res, body, cb) {
  const view = req.path + '.html';
  if (body instanceof Error) //TODO 500.html
    return cb(body.stack, null);

  if (Buffer.isBuffer(body)) //??? TODO raise error
    return cb(null, body.toString('base64'));

  nunjucks.render(view, body, cb);
}

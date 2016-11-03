const {auth} = require('./auth/views');
const {authorize} = require('./auth/middleware');
const {billing} = require('./billing');
const {datastore} = require('./datastore');
const {sync} = require('./connections');
const {publisher} = require('./publisher');
const contentNegotiatedSendMiddleware = require('./send_negotiated_response');
const express = require('express');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
const path = require('path');


//console.log("apps:", auth, publisher, billing, datastore);
const app = express();
const isDev = app.get('env') === 'development';

//app.set('views', __dirname + '../views');

nunjucks.configure(path.resolve(__dirname, '../views/'), {
  autoescape: true,
  express: app,
  noCache: isDev,
});

app.set('view engine', 'nunjucks');
app.set('defaultEngine', 'nunjucks')
app.engine('html', app.get('view'));

app.get('/', function(req, res) {
  let context = {};
  res.render('index.html', context);
});
app.get('/project-cms/', authorize, function(req, res) {
  let context = {
    user: req.user,
  };
  res.render('project-cms/index.html', context);
});

app.use('/media', express.static(__dirname + '/../media'));
app.use('/project-cms/src/mods', express.static(__dirname + '/../cms-mods'))
app.use('/project-cms/test', express.static(__dirname + '/../cms-tests'));
app.use('/project-cms', express.static(__dirname + '/../project-cms'));
app.use('/site', authorize, publisher);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/datastore', authorize, datastore);

app.use(contentNegotiatedSendMiddleware);

app.use('/auth', auth);
app.use('/billing', authorize, billing);


exports.app = app;

if (require.main === module) {
  sync().then(function () {
    app.listen(8000, function () {
      console.log('Backend listening on port 8000!');
    });
  });
}

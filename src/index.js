const {auth} = require('./auth/views');
const {authorize} = require('./auth/middleware');
const {billing} = require('./billing');
const {datastore} = require('./datastore');
const {sync} = require('./connections');
const {publisher} = require('./publisher');
const contentNegotiatedSendMiddleware = require('./send_negotiated_response');
const express = require('express');
const bodyParser = require('body-parser');
const expressNunjucks = require('express-nunjucks');


//console.log("apps:", auth, publisher, billing, datastore);
const app = express();
const isDev = app.get('env') === 'development';

app.set('views', __dirname + '../views');

const njk = expressNunjucks(app, {
    watch: isDev,
    noCache: isDev
});

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

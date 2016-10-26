const {auth} = require('./auth/views');
const {authorize} = require('./auth/middleware');
const {billing} = require('./billing');
const {datastore} = require('./datastore');
const {sync} = require('./connections');
const {publisher} = require('./publisher');
const express = require('express');
const bodyParser = require('body-parser');


//console.log("apps:", auth, publisher, billing, datastore);
var app = express();

app.use('/project-cms', express.static(__dirname + '/../project-cms'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/auth', auth);
app.use('/site', authorize, publisher);
app.use('/billing', authorize, billing);
app.use('/datastore', authorize, datastore);

exports.app = app;

if (require.main === module) {
  sync().then(function () {
    app.listen(8000, function () {
      console.log('Backend listening on port 8000!');
    });
  });
}

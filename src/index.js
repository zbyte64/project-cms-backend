var {auth} = require('./auth/views')
var {billing} = require('./billing')
var {datastore} = require('./datastore')
var express = require('express');


var app = express();
app.use('/auth', auth);
app.use('/billing', billing);
app.use('/datastore', datastore);

app.listen(8000, function () {
  console.log('Backend listening on port 8000!');
});

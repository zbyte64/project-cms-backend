var {auth} = require('./auth/views')
var {charge} = require('./billing')
var {datastore} = require('./datastore')
var express = require('express');


var app = express();
app.use('/auth', auth);
app.post('/charge', charge, function(req, res) {
  //charge success
});
app.use('/datastore', datastore);

app.listen(8000, function () {
  console.log('Example app listening on port 8000!');
});

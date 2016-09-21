var restify = require('restify');
var uuid5 = require("uuid5");
var uuid = require("uuid");
var _ = require('lodash');
//TODO process.env configurable
var r = require('rethinkdbdash')({
  port: 29015,
  host: 'rethinkdb',
});

var {authorize} = require('./auth/middleware');


var datastore = restify.createServer({
  name: 'datastore'
});
datastore.use(authorize);
datastore.use(function(req, res, next) {
  if (!req.user) {
    res.send(403, "Please login")
  } else {
    next()
  }
});
datastore.use(restify.acceptParser(datastore.acceptable));
datastore.use(restify.queryParser());
datastore.use(restify.bodyParser());
exports.datastore = datastore;


datastore.get('/:tableName', function(req, res) {
  //TODO process req.params as extra filters
  var filters = {
    _user: req.user.id,
    _tableName: req.params.tableName,
  };

  var jailed_query = r.table('userdata').filter(filters);

  if (_.isArray(req.params.keys)) { //can params even allow an array?
    var ids = compute_ids_from_keys(req.params.keys);
    jailed_query = jailed_query.getAll(ids);
  }

  if (req.params.key) {
    var id = compute_id_from_key(req.params.key);
    jailed_query = jailed_query.get(id);
  }

  jailed_query.run(pump_rdb_result(res));
});

//id is deterministic from user id and document key
datastore.put('/:tableName', function(req, res) {
  var documents = req.body;
  if (! _.isArray(documents)) {
    return res.send(400, "Endpoint only accepts an array of documents")
  }
  var filters = {
    _user: req.user.id,
    _tableName: req.params.tableName,
  };

  documents.forEach(x => {
    //id needs to be deterministic from namespace and key
    if (!x.key) {
      x.key = uuid.v4();
    }
    x.id = compute_id_from_key(filters._user, x.key);
    x._user = filters._user;
    x._tableName = filters._tableName;
  });

  var options = {
    conflict: "replace"
  }

  r.table('userdata').insert(documents, options).run(pump_rdb_result(res));
});

datastore.delete('/:tableName', function(req, res) {
  var keys = req.body;
  if (! _.isArray(keys)) {
    return res.send(400, "Endpoint only accepts an array of keys")
  }

  var ids = compute_ids_from_keys(req.user.id, keys);

  r.table('userdata').getAll(ids).delete().run(pump_rdb_result(res));
});


function compute_id_from_key(userId, key) {
  //CONSIDER userId should be a uuid
  return uuid5(userId + ":" + key);
}

function compute_ids_from_keys(userId, keys) {
  return _.map(keys, _.partial(compute_id_from_key, userId));
}

function pump_rdb_result(res) {
  return function(error, cursor) {
    if (error) {
      res.send(new Error(error))
    } else {
      if (cursor.toArray) {
        cursor.toArray(function(error2, result) {
          if (error2) {
            res.send(new Error(error2))
          } else {
            res.send(result)
          }
        });
      } else {
        res.send(cursor)
      }
    }
  }
}

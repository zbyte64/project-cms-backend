var restify = require('restify');
var uuid5 = require("uuid5");
var uuid = require("uuid");
var _ = require('lodash');

var {UserData} = require('./connections');
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
  let userId = req.user.id;
  let tableName = req.params.tableName;
  let query;

  if (_.isArray(req.params.keys)) { //can params even allow an array?
    let ids = compute_ids_from_keys(userId, tableName, req.params.keys);
    query = UserData.findAll({
        where: {
            id: {$in: ids}
        }
    });
  }

  if (req.params.key) {
    let id = compute_id_from_key(userId, tableName, req.params.key);
    query = UserData.findAll({
        where: {
            id: id
        }
    });
  }

  if (!query) {
    query = UserData.findAll({
        where: {
            _user: userId,
            _tableName: tableName,
        }
    });
  }

  pump_query_result(query, res);
});

//id is deterministic from user id and document key
datastore.put('/:tableName', function(req, res) {
  let documents = req.body;
  if (! _.isArray(documents)) {
    return res.send(400, "Endpoint only accepts an array of documents")
  }
  let userId = req.user.id;
  let tableName = req.params.tableName;

  documents.forEach(x => {
    //id needs to be deterministic from namespace and key
    if (!x.key) {
      x.key = uuid.v4();
    }
    x.id = compute_id_from_key(userId, tableName, x.key);
    x._user = userId;
    x._tableName = tableName;
  });

  let options = {
    updateOnDuplicate: ["value"]
  }

  query = UserData.bulkCreate(documents, options);

  pump_query_result(query, res);
});

datastore.del('/:tableName', function(req, res) {
  let keys = req.body;
  if (! _.isArray(keys)) {
    return res.send(400, "Endpoint only accepts an array of keys")
  }
  let userId = req.user.id;
  let tableName = req.params.tableName;

  let ids = compute_ids_from_keys(userId, tableName, keys);

  query = UserData.destroy({
    where: {
      id: {$in: ids}
  });
  pump_query_result(query, res);
});


function compute_id_from_key(userId, tableName, key) {
  //CONSIDER userId should be a uuid
  //CONSIDER this must be deterministic
  return uuid5(`${userId}:${tableName}:${key}`);
}

function compute_ids_from_keys(userId, tableName, keys) {
  return _.map(keys, _.partial(compute_id_from_key, tableName, userId));
}

function pump_query_result(query, res) {
  return query.then(result => {
    res.send(result);
  }, error => {
    res.send(new Error(error));
  });
}

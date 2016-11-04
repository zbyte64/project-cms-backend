import _ from 'lodash';
import levelup from 'levelup';
import querystring from 'querystring';
import {Buffer} from 'buffer';
import {AbstractLevelDOWN, AbstractIterator} from 'abstract-leveldown';
import {v4} from 'node-uuid';


export class HostedIterator extends AbstractIterator {
  constructor(db, options) {
    super(db);
    this._items = [];
    this._cursor = 0;
  }

  _next(cb) {
    const item = this._items[this._cursor];

    if (item) {
      process.nextTick(() => cb(null, item.key, item.value));
      delete this._items[this._cursor];
      this._cursor++;
      return;
    }

    if (item === null) {
      process.nextTick(cb);
      return;
    }

    this.db._call_store({ method: 'GET' }).then(responseData => {
      this._items = responseData;
      this._items.push(null);
      this._next(cb);
    }).catch(error => {
      console.error(error);
      cb(error);
      this._ended = true; //now what?
    });
  }
}


export class HostedDOWN extends AbstractLevelDOWN {
  constructor(location) {
    super(location);
    this._tableName = location;
  }

  _generate_headers() {
    return new Headers({
      //TODO Authorization header
      "Content-Type": "application/json",
    });
  }

  _call_store({method, body, params}) {
    let url = `/datastore/${this._tableName}`;
    let headers = this._generate_headers();

    if (body) body = JSON.stringify(body);
    if (params) {
      url += "?" + querystring.stringify(params);
    }

    return fetch(url, {
      method: method,
      headers: headers,
      credentials: 'include',
      body: body
    }).then(response => {
      if (!response.ok) return Promise.reject(response.statusText);
      return response.json();
    });
  }

  _open(options, callback) {
    process.nextTick(function () { callback(null, this) }.bind(this))
  }

  _put(key, value, options, callback) {
    let body = [{
      key, value
    }];

    let request = this._call_store({
      method: 'PUT',
      body,
    }).then(responseData => {
      callback(null, responseData);
    }).catch(error => {
      callback(error);
    });
  }

  _get(key, options, callback) {
    let params = {key};
    this._call_store({
      method: 'GET',
      params,
    }).then(responseData => {
      callback(null, responseData[0].value);
    }).catch(error => {
      callback(error);
    });
  }

  _del(key, options, callback) {
    let params = {key};
    this._call_store({
      method: 'DELETE',
      params,
    }).then(responseData => {
      callback(null, null);
    }).catch(error => {
      callback(error);
    });
  }

  _iterator(options) {
    return new HostedIterator(this, options);
  }
}

export class HostedStorage {
  constructor() {
    //pass
  }

  identifier() {
    return "hosted:cms";
  }

  getTable = (baseUrl) => {
    let table_key = encodeURIComponent(baseUrl);
    let db = (location) => new HostedDOWN(location);
    let options = { db: db, valueEncoding: "json" };
    return levelup(table_key, options);
  }

  destroy = () => {
    return new Promise(function(resolve, reject) {
      return reject('Not implemented');
    });
  }
}

export function datastoreFactory() {
  return new HostedStorage();
};


function futch(url, opts={}, onProgress) {
    return new Promise( (res, rej)=>{
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open(opts.method || 'get', url);
        xhr.send(opts.body);
        for (var k in opts.headers||{})
            xhr.setRequestHeader(k, opts.headers[k]);
        xhr.onload = e => res(e.target.responseText);
        xhr.onerror = rej;
        if (xhr.upload && onProgress)
            xhr.upload.onprogress = onProgress; // event.loaded / event.total * 100 ; //event.lengthComputable
    });
}


export function upload(config, files, overwrite, onProgress) {
  let formData = new FormData();
  let pathToFile = {};
  files.forEach(file => {
    let path = file.path;
    //if overwrite is not specified we must ensure we have a unique path
    //CONSIDER: overwrite should always be accompanied with path
    if (!path || !overwrite) {
      let id = v4();
      let extension = _.last(file.name.split('.'));
      //CONSIDER: path is unavailable until we publish
      //we can instead push an /ipfs/objectid as path
      //or we need a url tag to translate media uri to url
      // {% "ipfs:objectid"|url %} => to get accessible url
      // ? url could trigger a retrieval & upload ?
      // url in preview mode would resolve to /ipfs/objectid
      // url in publish mode would resolve to /media/path
      path = `/media/${id}.${extension}`;
    }
    pathToFile[path] = file;
    formData.append(path, file, file.name);
  });
  return futch('/site/upload', {
    method: 'POST',
    body: formData,
  }, onProgress).then(responseText => {
    //response = {uploadPath: {path, hash, size}}
    let response = JSON.parse(responseText);
    return _.map(response, (value, path) => {
      let file = pathToFile[path];
      return _.assign(value, {
        path: path,
        name: file.name,
        type: file.type,
      });
    });
  });
}


export function publish(config={}) {
  let formData = new FormData();
  let result;

  //TODO use a multipart stream buffer
  function done() {
    return futch('/site/publish', {
      method: 'POST',
      body: formData,
    }).then(responseText => {
      result = JSON.parse(responseText);
      return result;
    });
  }

  function view() {
    const location = window.location;
    //TODO use site hostname instead
    let url = `http://${location.hostname}/ipfs/${result.Hash}`;
    return window.open(url, '_blank');
  }

  function pushContent(path, content, mimetype) {
    let name = _.last(path.split('/'));
    if (config.prefix) {
      path = config.prefix + path;
    }
    formData.append(path, new Buffer(content), name);
  }

  return {
    pushContent,
    view,
    done
  }
}

function resolve(environment, token) {
  switch(environment) {
    case 'preview':
      return `/ipfs/${token.hash}`;
    case 'publish':
    default:
      return token.path;
  }
}

export function publisherFactory(config={}) {
  return {
    resolver: resolve,
    uploader: _.partial(upload, config),
    publisher: _.partial(publish, config),
  };
}

import _ from 'lodash';
import levelup from 'levelup';
import querystring from 'querystring';
import {Buffer} from 'buffer';
import {AbstractLevelDOWN, AbstractIterator} from 'abstract-leveldown';
import {v4} from 'node-uuid';


export class BuildicusIterator extends AbstractIterator {
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


export class BuildicusDOWN extends AbstractLevelDOWN {
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
    return new BuildicusIterator(this, options);
  }
}

export class BuildicusStorage {
  constructor() {
    //pass
  }

  identifier() {
    return "buildicus:cms";
  }

  getTable = (baseUrl) => {
    let table_key = encodeURIComponent(baseUrl);
    let db = (location) => new BuildicusDOWN(location);
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
  return new BuildicusStorage();
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
  //TODO overwrite, implement or ditch (if not overwrite then generate uuid name)
  let formData = new FormData();
  files.foreach(file => {
    let path = file.path;
    if (!path) {
      let id = v4();
      let extension = _.last(file.name.split('.'));
      path = `/media/${id}.${extension}`;
    }
    formData.append(path, file, file.name);
  });
  return futch('/site/upload', {
    method: 'POST',
    body: formData,
  }, onProgress).then(responseText => {
    //response = [{path, hash, size}]
    let response = JSON.parse(responseText);
    return response.map((value, index) => {
      let file = files[index];
      return _.assign(value, {
        name: file.name,
        type: file.type,
      });
    });
  });
}

export function uploaderFactory(config) {
  return _.partial(upload, config);
}


export function publisherFactory(config) {
  let formData = new FormData();
  let result;

  //TODO use a multipart stream buffer
  //TODO support this in core
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

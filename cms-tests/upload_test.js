import assert from 'assert';
import {Map} from 'immutable';
import {Buffer} from 'buffer';
import {uploaderFactory, publisherFactory} from '~/mods/hosted';


describe("backend upload", function() {
  describe("uploaderFactory", function() {
    let uploader;
    it("returns uploader", function() {
      uploader = uploaderFactory();
      assert(uploader);
    });

    it("uploads file to a unique place", function() {
      let file = new File(["hello world"], "readme.txt", {type: "plain/txt"});
      return uploader([file]).then(result => {
        assert(result);
        let fileResult = result[0];
        assert(fileResult.path);
        assert.equal(fileResult.path.indexOf("readme.txt"), -1)
      });
    });

    it("uploads file to desired path with overwrite flag", function() {
      let path = "readme.txt";
      let file = new File(["hello world"], "readme.txt", {type: "plain/txt"});
      file.path = path;
      return uploader([file], true).then(result => {
        assert(result);
        let fileResult = result[0];
        assert(fileResult.path);
        assert.equal(fileResult.path, path)
      });
    });
  });

  describe("publisherFactory", function() {
    let publisher;

    it("returns publisher", function() {
      publisher = publisherFactory();
      assert(publisher);
      assert(publisher.pushContent);
      assert(publisher.done);
      assert(publisher.view);
    });

    it("publisher pushes content", function() {
      let path = 'index.html';
      let content = '<html><body>Hello World</body></html>';
      let mimeType = 'text/html';
      return publisher.pushContent(path, content, mimeType);
    });

    it("publisher done returns a promise", function() {
      return publisher.done();
    });
  });
});

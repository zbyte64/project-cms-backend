import assert from 'assert';
import {Map} from 'immutable';
import {getStorage, destroy, setStorage} from '~/reducers/tables';
import {datastoreFactory} from '~/mods/hosted';


describe("backend datastore", function() {
  describe("datastoreFactory", function() {
    let datastore;
    it("returns Storage instance", function() {
      datastore = datastoreFactory();
      assert(datastore);
      assert(datastore.getTable);
      assert(datastore.identifier());
    });

    describe("storage instance", function() {
      it("getTable return levelup instance", function() {
        let table = datastore.getTable("$test");
        assert(table);
        assert(table.get);
        assert(table.put);
        assert(table.del);
      });
    });
  });

  describe("datastore multiplexer", function() {
    describe("setStorage", function() {
      it("constructs Levelup Multiplexer", function() {
        return setStorage({ module: "~/mods/hosted" })
      });
    });

    describe("putObject", function() {
      it("stores an object", function() {
        return getStorage().putObject("$test", "key", {"foo": "bar"});
      });
    });

    describe("readTable", function() {
      it("returns all values for a table", function() {
        console.log("hello")
        return getStorage().readTable("$test").then(key_values => {
          assert.deepEqual(key_values, { key: {
            id: "key",
            foo: "bar",
          }});
        });
      });
    });
  });
});

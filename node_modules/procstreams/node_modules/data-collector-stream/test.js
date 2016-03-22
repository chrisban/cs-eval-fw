var assert = require('assert')
  , fs = require('fs')
  , Collector = require('./index');

var license = fs.readFileSync('./LICENSE')
  , collector = new Collector();

fs.createReadStream('./LICENSE').pipe(collector);
collector.on('end', function() {
  var data = collector.getData()
    , bytes = collector.getBytesWritten();

  assert.ok(Buffer.isBuffer(data));
  assert.equal(license.length, data.length);
  assert.equal(license.length, bytes);
});

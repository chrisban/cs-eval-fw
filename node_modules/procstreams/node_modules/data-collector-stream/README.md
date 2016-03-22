data-collector-stream
=====================

A read/write stream that collects data

```
var Stream = require('stream'),
  fs = require('fs'),
  Collector = require('./streams/collector');

var collector = new Collector();
fs.createReadStream('./large-file.txt').pipe(collector);
collector.on('end', function() {
    console.log(collector.getBytesWritten());
    console.log(collector.getData());
});
```

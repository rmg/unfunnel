# Unfunnel

A simple stream muxer/demuxer

## Examples

### Server
```js
var net = require('net')
  , Unfunnel = require('unfunnel')
  , server = net.createServer(12345)

function reader( stream ) {
  return function() {
    console.log(stream.read().toString())
  }
}

server.on('connection', function (c) {
  var muxer = new Unfunnel(c)
    , data = muxer.endpoint('data')
    , ctrl = muxer.endpoint('ctrl')
  data.on('readable', reader(data))
  ctrl.on('readable', reader(ctrl))
})
```

### Client
```js
var net = require('net')
  , Unfunnel = require('unfunnel')
  , client = net.createConnection(12345)

function reader( stream ) {
  return function() {
    console.log(stream.read().toString())
  }
}

client.on('connect', function () {
  var muxer = new Unfunnel(client)
    , data = muxer.endpoint('data')
    , ctrl = muxer.endpoint('ctrl')
  data.on('readable', reader(data))
  ctrl.on('readable', reader(ctrl))
  ctrl.write("command here")
  data.write("some big long data stream...")
})
```
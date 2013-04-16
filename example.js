var assert = require('assert')
  , stream = require('stream')
  , Unfunnel = require('./')
  , net = require('net')

function assertReceives(eStream, eString, done) {
  return function () {
    var str = eStream.read().toString()
    console.log(str)
    assert.equal(str, eString)
    done()
  }
}

var north = new stream.PassThrough()
  , south = new stream.PassThrough()
  , a = new Unfunnel(north, south)
  , b = new Unfunnel(south, north)
  , a_b = a.endpoint('foo')
  , b_a = b.endpoint('foo')
b_a.on('readable', function() {
  console.log(b_a.read().toString())
  // assert( b_a.read() == "monkey!" )
})
a_b.write("monkey!")

;(function () {
  var count = 0
    , inc = function (err, something) {
        count += 1
        if (err)
          throw err
        if (count == 4)
          console.log("done!")
          // done()
      }
    , testConn = function(a, b, outer_conn) {
        return function (conn) {
          console.log("connection", a, b)
          conn = conn || outer_conn
          var mux = new Unfunnel(conn)
            , foo = mux.endpoint('foo')
            , bar = mux.endpoint('bar')
          foo.on('readable', assertReceives(foo, "foo_" + b, inc))
          bar.on('readable', assertReceives(bar, "bar_" + b, inc))
          foo.write("foo_" + a)
          bar.write("bar_" + a)
        }
      }
    , server = net.createServer(testConn('north', 'south'))
  server.listen(12345)
  var client = net.createConnection(12345)
  client.on('connect', testConn('south', 'north', client) )
})()
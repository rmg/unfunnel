var assert = require('assert')
  , stream = require('stream')
  , Unfunnel = require('../')

function assertReceives(eStream, eString, done) {
  return function () {
    var str = eStream.read().toString()
    // console.log(str, eString)
    assert.equal(str, eString)
    done()
  }
}

describe("Unfunnel", function () {
  it("should handle multiple streams", function (done) {
    var north = new stream.PassThrough()
      , south = new stream.PassThrough()
      , a = new Unfunnel(north, south)
      , b = new Unfunnel(south, north)
      , foo_a = a.endpoint(0x0f00)
      , foo_b = b.endpoint(0x0f00)
      , bar_a = a.endpoint(0x0ba0)
      , bar_b = b.endpoint(0x0ba0)
      , count = 0
    function inc(err, something) {
      count += 1
      if (err)
        throw err
      if (count == 4)
        done()
    }
    foo_a.on('readable', assertReceives(foo_a, "foo_b", inc))
    foo_b.on('readable', assertReceives(foo_b, "foo_a", inc))
    bar_a.on('readable', assertReceives(bar_a, "bar_b", inc))
    bar_b.on('readable', assertReceives(bar_b, "bar_a", inc))
    foo_a.write("foo_a")
    foo_b.write("foo_b")
    bar_a.write("bar_a")
    bar_b.write("bar_b")
  })

  it("should stream multiple streams over a single duplex stream", function (done) {
    var read_count = 0
      , inc = function (err) {
          read_count += 1
          if (err)
            throw err
          if (read_count == 4) {
            client.end()
          }
        }
      , close_count = 0
      , close = function (err) {
          close_count += 1
          if (err)
            throw err
          if (close_count == 2) {
            done()
          }
      }
      , testConn = function(a, b, outer_conn) {
          return function (conn) {
            conn = conn || outer_conn
            var mux = new Unfunnel(conn)
              , foo = mux.endpoint(0x0f00)
              , bar = mux.endpoint(0x0ba0)
            conn.on('end', close)
            foo.on('readable', assertReceives(foo, "foo_" + b, inc))
            bar.on('readable', assertReceives(bar, "bar_" + b, inc))
            foo.write("foo_" + a)
            bar.write("bar_" + a)
          }
        }
      , net = require('net')
      , server = net.createServer(testConn('north', 'south'))
    server.listen(12345)
    var client = net.createConnection(12345)
    client.on('connect', testConn('south', 'north', client) )
  })
})

var assert = require('assert')
  , stream = require('stream')
  , Unfunnel = require('../')

function assertReceives(eStream, eString, done) {
  return function () {
    var str = eStream.read()
    // console.log(str, eString)
    assert.equal(str, eString)
    done()
  }
}

describe('Unfunnel', function () {
  describe('over stream.PassThrough streams', function () {
    var north = new stream.PassThrough()
      , south = new stream.PassThrough()
      , a = new Unfunnel(north, south)
      , b = new Unfunnel(south, north)
      , foo_a = a.endpoint('foo')
      , foo_b = b.endpoint('foo')
      , bar_a = a.endpoint('bar')
      , bar_b = b.endpoint('bar')
      , count = 0
      , ender
    function inc(err, something) {
      count += 1
      if (err)
        throw err
      if (count == 4)
        ender()
    }
    it('should handle multiple streams', function (done) {
      ender = done
      foo_a.on('readable', assertReceives(foo_a, 'foo_b', inc))
      foo_b.on('readable', assertReceives(foo_b, 'foo_a', inc))
      bar_a.on('readable', assertReceives(bar_a, 'bar_b', inc))
      bar_b.on('readable', assertReceives(bar_b, 'bar_a', inc))
      foo_a.write('foo_a')
      foo_b.write('foo_b')
      bar_a.write('bar_a')
      bar_b.write('bar_b')
    })
  })
  describe('over a single duplex stream (net)', function () {
    it('should stream multiple streams over a single duplex stream', function (done) {
      var read_count = 0
        , close_count = 0
        , net = require('net')
        , client, server

      server = net.createServer(testConn('north', 'south'))
      server.on('listening', function() {
                client = net.createConnection(server.address().port)
                client.on('connect', testConn('south', 'north', client) )
            })
            .listen(12345)

      function inc(err) {
        read_count += 1
        if (err)
          throw err
        if (read_count == 4) {
          client.end()
        }
      }
      function close(err) {
        close_count += 1
        if (err)
          throw err
        if (close_count == 2) {
          done()
        }
      }
      function testConn(a, b, outer_conn) {
        return function (conn) {
          conn = conn || outer_conn
          var mux = new Unfunnel(conn)
            , foo = mux.endpoint('foo')
            , bar = mux.endpoint('bar')
          conn.on('end', close)
          foo.on('readable', assertReceives(foo, 'foo_' + b, inc))
          bar.on('readable', assertReceives(bar, 'bar_' + b, inc))
          foo.write('foo_' + a)
          bar.write('bar_' + a)
        }
      }
    })
  })
})

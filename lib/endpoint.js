var stream = require('stream')

function idFromName(name) {
  var buf = new Buffer(4)
  buf.fill(0)
  buf.write(name)
  return buf.readUInt32LE(0)
}

function Endpoint(channel, options) {
  if (!(this instanceof Endpoint))
    return new Endpoint(channel, options)

  stream.Duplex.call(this, options)
  this.channel = channel
  this.name = options.name
  this.id = options.id || idFromName(this.name)
  // console.log("new endpoint!", this.name)
  // this.id = options['id']
}

Endpoint.prototype = Object.create(stream.Duplex.prototype,
                                   { constructor: { value: Endpoint } })

Endpoint.prototype._read = function(size) {
  // This isn't actually needed because we are pushed to instead of pulling
}

Endpoint.prototype.receive = function(chunk, encoding) {
  this.push(chunk)
}

Endpoint.prototype._write = function(chunk, encoding, callback) {
  return this.channel.send(this, chunk, encoding, callback)
}

module.exports = Endpoint
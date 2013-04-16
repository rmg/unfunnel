var stream = require('stream')

function Endpoint(channel, options) {
  if (!(this instanceof Endpoint))
    return new Endpoint(channel, options)

  stream.Duplex.call(this, options)
  this.channel = channel
  this.name = options['name']
}

Endpoint.prototype = Object.create(stream.Duplex.prototype,
                                   { constructor: { value: Endpoint } })

Endpoint.prototype._read = function(size) {
  console.log("I have no idea what this should do...")
}

Endpoint.prototype.receive = function(chunk, encoding) {
  this.push(chunk)
}

Endpoint.prototype._write = function(chunk, encoding, callback) {
  return this.channel.send(this.name, chunk, encoding, callback)
}

module.exports = Endpoint
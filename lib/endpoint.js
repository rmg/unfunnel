var stream = require('stream')
  , cityhash = null
  , util = require('util')

if (false)
  cityhash = require('cityhash')

function idFromName(name) {
  // util.debug(typeof name)
  if (name instanceof Number) {
    return (name >>> 0)
  }
  if (cityhash)
    return cityhash.hash32(name).low
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
  if (!options.id && !options.name)
    throw new Error('Must provide a name or ID for endpoints')
  if (options.id && !options.name) {
    options.name = options.id
  }
  this.name = options.name
  this.id = options.id || idFromName(this.name)
  this.channel.on('end', this.end.bind(this))
  this.channel.on('error', util.error)
  // console.log('new endpoint!', this.name)
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

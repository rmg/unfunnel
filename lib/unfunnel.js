var Endpoint = require('./endpoint.js')
  , protocol = require('./protocol.js')
  , events   = require('events')
  , util     = require('util')

function Unfunnel(istream, ostream) {
  if (!(this instanceof Unfunnel))
    return new Unfunnel(istream, ostream)
  events.EventEmitter.call(this)

  this.istream = istream
  this.ostream = ostream || istream
  this.endpoints = []
  this.istream.setEncoding('utf8')
  this.ostream.setEncoding('utf8')
  this.istream.decodeStrings = true
  this.ostream.decodeStrings = true
  // this.istream.encoding = this.ostream.encoding = 'utf8'
  this.istream.on('readable', this.receive.bind(this))
  this.istream.on('error', util.error)
  this.ostream.on('error', util.error)
  this.istream.on('error', this.stop_reading.bind(this))
  this.istream.on('end', this.stop_reading.bind(this))
  this.istream.on('close', this.stop_reading.bind(this))
  this.ostream.on('error', this.stop_writing.bind(this))
  this.ostream.on('end', this.stop_writing.bind(this))
  this.ostream.on('close', this.stop_writing.bind(this))
}

util.inherits(Unfunnel, events.EventEmitter)

Unfunnel.prototype.end = function () {
  for (var e = this.endpoints.length - 1; e >= 0; e--) {
    this.endpoints[e].end()
  }
  this.emit('end')
}

Unfunnel.prototype.stop_writing = function () {
  this.ostream = null
  this.end()
}

Unfunnel.prototype.stop_reading = function () {
  this.istream = null
  this.end()
}

Unfunnel.prototype.createEndpoint = function(options) {
  var endpoint = new Endpoint(this, options)
  if (options.name && this.lookupEndpoint(options.name)) {
    throw new Error('Endpoints must have unique names')
  }
  if (options.id && this.findEndpointByID(options.id)) {
    throw new Error('Endpoints must have unique names')
  }
  this.endpoints.unshift(endpoint)
  return endpoint
}

Unfunnel.prototype.endpoint = function(name) {
  var endpoint = this.lookupEndpoint(name)
  if (!endpoint) {
    endpoint = new Endpoint(this, {name: name})
    this.endpoints.unshift(endpoint)
  }
  return endpoint
}

function findEndpointBy(field) {
  return function(needle) {
    for (var e = this.endpoints.length - 1; e >= 0; e--) {
      if (this.endpoints[e][field] == needle)
        return this.endpoints[e]
    }
    return null
  }
}

Unfunnel.prototype.findEndpointByID = findEndpointBy('id')

Unfunnel.prototype.lookupEndpoint = findEndpointBy('name')

Unfunnel.prototype.send = function(endpoint, chunk, encoding, callback) {
  var packet = protocol.encode(endpoint.id, chunk, encoding)
  return this.ostream.write(packet, callback)
}

Unfunnel.prototype.receive_packet = function(in_stream) {
  var packet = protocol.decode(in_stream)
  if (packet) {
    packet.endpoint = this.findEndpointByID(packet.id)
    if (!packet.endpoint) {
      packet.endpoint = this.createEndpoint({id: packet.id})
      this.emit('endpoint', packet.endpoint)
    }
  }
  return packet
}

Unfunnel.prototype.receive = function() {
  var packet, endpoint, chunk
  while (packet = this.receive_packet(this.istream)) {
    chunk = packet.chunk
    if (chunk)
      chunk = new Buffer(chunk)
    if (packet.event == 'data' && chunk)
      packet.endpoint.receive(chunk, packet.encoding)
    else
      console.log('WTF?', packet.event, chunk)
  }
}

module.exports = Unfunnel

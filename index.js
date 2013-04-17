var Endpoint = require('./lib/endpoint.js')
  , protocol = require('./lib/protocol.js')
  , events   = require('events')
  , util     = require('util')

function Unfunnel(istream, ostream) {
  if (!(this instanceof Unfunnel))
    return new Unfunnel(istream, ostream)
  events.EventEmitter.call(this)

  this.istream = istream
  this.ostream = ostream || istream
  this.endpoints = []
  this.istream.on('readable', this.receive.bind(this))
}

util.inherits(Unfunnel, events.EventEmitter)

Unfunnel.prototype.createEndpoint = function(options) {
  var endpoint
  if (options.name && this.lookupEndpoint(options.name)) {
    throw new Error("Endpoints must have unique names")
  }
  if (options.id && this.findEndpointByID(options.id)) {
    throw new Error("Endpoints must have unique names")
  }
  endpoint = new Endpoint(this, options)
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

Unfunnel.prototype.findEndpointByID = function(id) {
  for (var e = this.endpoints.length - 1; e >= 0; e--) {
    if (this.endpoints[e].id == id)
      return this.endpoints[e]
  }
  return null
}

Unfunnel.prototype.lookupEndpoint = function(name) {
  for (var e = this.endpoints.length - 1; e >= 0; e--) {
    if (this.endpoints[e].name == name)
      return this.endpoints[e]
  }
  return null
}

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
      this.emit("endpoint", packet.endpoint)
    }
  }
  return packet
}

Unfunnel.prototype.receive = function() {
  var packet, endpoint
  while (packet = this.receive_packet(this.istream)) {
    if (packet.event == 'data')
      packet.endpoint.receive(new Buffer(packet.chunk), packet.encoding)
    else
      console.log("WTF?", packet)
  }
}

module.exports = Unfunnel
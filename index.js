var Endpoint = require('./lib/endpoint.js')

function Unfunnel(istream, ostream) {
  this.istream = istream
  this.ostream = ostream || istream
  this.endpoints = []
  this.istream.on('readable', this.receive.bind(this))
}

Unfunnel.prototype.endpoint = function(name) {
  var endpoint = this.lookupEndpoint(name)
  if (!endpoint) {
    endpoint = new Endpoint(this, {name: name})
    this.endpoints.unshift(endpoint)
  }
  return endpoint
}

Unfunnel.prototype.lookupEndpoint = function(name) {
  for (var e = this.endpoints.length - 1; e >= 0; e--) {
    if (this.endpoints[e].name == name)
      return this.endpoints[e]
  }
  return null
}

Unfunnel.prototype.send = function(name, chunk, encoding, callback) {
  var packet = { "event": "data"
               , "name": name
               , "chunk": chunk
               , "encoding": encoding
               }
    , json = JSON.stringify(packet)
    , buf = new Buffer(2 + json.length)
  buf.writeUInt16LE(json.length, 0, true)
  buf.write(json, 2)
  return this.ostream.write(buf, callback)
}

Unfunnel.prototype.receive_packet = function() {
  var raw, len
  raw = this.istream.read(2)
  if (raw) {
    len = raw.readUInt16LE(0)
    raw = this.istream.read(len)
    if (raw)
      return JSON.parse(raw)
  }
  return null
}

Unfunnel.prototype.receive = function() {
  var packet, endpoint
  while (packet = this.receive_packet()) {
    endpoint = this.endpoint(packet.name)
    if (packet.event == 'data')
      endpoint.receive(new Buffer(packet.chunk), packet.encoding)
    else
      console.log("WTF?", packet)
  }
}

module.exports = Unfunnel
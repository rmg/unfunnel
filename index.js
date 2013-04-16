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
  var packet = { "event": "write"
               , "name": name
               , "chunk": chunk
               , "encoding": encoding
               }
    , json = JSON.stringify(packet)
    , buf = new Buffer(4 + json.length)
  // console.log(json.length)
  buf.writeUInt32LE(json.length, 0, true)
  buf.write(json, 4)
  return this.ostream.write(buf, callback)
}

Unfunnel.prototype.receive = function() {
  var len = this.istream.read(4).readUInt32LE(0)
    , raw = this.istream.read(len)
    , packet = JSON.parse(raw)
    , endpoint = this.endpoint(packet.name)
  endpoint.receive(new Buffer(packet.chunk), packet.encoding)
}

module.exports = Unfunnel
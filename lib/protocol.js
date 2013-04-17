// TODO: Constants, other message types
// TODO: Hey, maybe this should be an even emitter?
var util = require('util')

function encode (id, chunk, encoding, callback) {
  var len = chunk.length + 5 + 2
    , packet = new Buffer(len)
  // TODO: fragment chunks > 65k-7
  // length:16
  packet.writeUInt16BE(len, 0, true)
  // type:8
  packet.writeUInt8(1, 2)
  // id:32
  packet.writeUInt32BE(id & 0xffffffff, 3)
  // payload:(len-7)
  chunk.copy(packet, 7)
  // util.log(util.format("encoded: %s", util.inspect(packet, {colors: true})))
  return packet
}

function decode (istream) {
  var raw, len, type, id, packet
  // length:16
  raw = istream.read(2)
  if (raw) {
    // length:16
    len = raw.readUInt16BE(0)
    // type:8
    raw = istream.read(1)
    if (raw) {
      // type:8
      type = raw.readUInt8(0)
      // id:32
      raw = istream.read(4)
      if (raw) {
        id = raw.readUInt32BE(0)
        packet = { "event": 'data'
                 , "id": id
                 , "chunk": istream.read(len-7)
                 }
        // util.log(util.format("decoded: %s", util.inspect(packet, {colors: true})))
        return packet
      }
    }
  }
  return null
}

module.exports = { "encode": encode, "decode": decode }

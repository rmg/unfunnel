// TODO: Implement better protocol
// I think what I'm going to do is use len:16, type:8, id:32,
// payload:(len-6). If type is data, ship payload directly to the stream
// identified by id (derived from the given name, mapped locally). If
// type is not data, then payload will be sent to the handler for that
// message type. So far I'm imagining create and close as message types.

function encode (name, chunk, encoding, callback) {
  var len = chunk.length + 5 + 2
    , packet = new Buffer(len)
    , id = name | 0x0000
  // TODO: fragment chunks > 65k-7
  // length:16
  packet.writeUInt16BE(len, 0, true)
  // type:8
  packet.writeUInt8(1, 2)
  // id:32
  packet.writeUInt32BE(id, 3)
  // payload:(len-7)
  chunk.copy(packet, 7)
  // console.log("sending for", id)
  // console.log("tx", packet)
  // console.log("send", len, 1, id, chunk)
  return packet
}

function decode (istream) {
  var raw, len, type, id, packet
  // length:16
  raw = istream.read(2)
  if (raw) {
    // console.log("rxlen", raw)
    // length:16
    len = raw.readUInt16BE(0)
    // type:8
    raw = istream.read(1)
    if (raw) {
      // type:8
      // console.log("rxtype", raw)
      type = raw.readUInt8(0)
      // id:32
      raw = istream.read(4)
      if (raw) {
        // console.log("rxid", raw)
        id = raw.readUInt32BE(0)
        packet = { "event": 'data'
                 , "id": id
                 , "chunk": istream.read(len-7)
                 }
        // console.log("received", len, type, id, packet.chunk)
        return packet
      }
    }
  }
  return null
}

module.exports = { "encode": encode
                 , "decode": decode
                 }
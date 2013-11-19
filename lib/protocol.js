// TODO: Constants, other message types
// TODO: Hey, maybe this should be an even emitter?
var util = require('util')
  , Buffer = require('buffer').Buffer

function encode (id, chunk, encoding, callback) {
  var len = chunk.length + 5 + 2
    , packet = new Buffer(len)
  // TODO: fragment chunks > 65k-7
  if (len > 0xffff)
    throw Error('TODO: implement packet fragments')
  // length:16
  packet.writeUInt16BE(len, 0, true)
  // type:8
  packet.writeUInt8(1, 2)
  // id:32
  packet.writeUInt32BE(id >>> 0, 3)
  // payload:(len-7)
  chunk.copy(packet, 7)
  // util.error(util.format('encoded: %s', util.inspect(packet, {colors: true})))
  return packet
}

function bufferRead(read_stream, size) {
  var raw = read_stream.read(size)
    , buf = null
  if (!raw || Buffer.isBuffer(raw)) {
    // util.error(util.inspect(raw))
    return raw
  }
  buf = new Buffer(raw)
  // util.error(util.inspect(buf))
  if (buf.length < size) {
    // util.error(util.format('%d < %d', buf.length, size))
    return Buffer.concat([buf, bufferRead(read_stream, size - buf.length)], size)
  }
  return buf
}

function decode (istream) {
  var raw, len, type, id, packet
  // length:16
  raw = bufferRead(istream, 2)
  if (raw && raw.length == 2) {
    // length:16
    len = raw.readUInt16BE(0)
    // type:8
    raw = bufferRead(istream, 1)
    if (raw) {
      // type:8
      type = raw.readUInt8(0)
      // id:32
      raw = bufferRead(istream, 4)
      if (raw) {
        id = raw.readUInt32BE(0)
        packet = { 'event': 'data'
                 , 'id': id
                 , 'chunk': bufferRead(istream, len-7)
                 }
        // util.log(util.format('decoded: %s', util.inspect(packet, {colors: true})))
        return packet
      }
    }
  }
  // util.error('Failed to decode!', raw)
  return null
}

module.exports = { 'encode': encode, 'decode': decode }

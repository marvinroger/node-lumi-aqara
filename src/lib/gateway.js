const crypto = require('crypto')
const events = require('events')

const {AQARA_IV, GATEWAY_HEARTBEAT_INTERVAL_MS, GATEWAY_HEARTBEAT_OFFLINE_RATIO} = require('../constants')
const Magnet = require('./magnet')
const Switch = require('./switch')

class Gateway extends events.EventEmitter {
  constructor (opts) {
    super()

    this._ip = opts.ip
    this._sid = opts.sid
    this._sendUnicast = opts.sendUnicast

    this._heartbeatWatchdog = null
    this._rearmWatchdog()

    this._color = { r: 0, g: 0, b: 0 }

    this._subdevices = new Map()

    const payload = '{"cmd": "get_id_list"}'
    this._sendUnicast(payload)
  }

  _rearmWatchdog () {
    if (this._heartbeatWatchdog) clearTimeout(this._heartbeatWatchdog)
    this._heartbeatWatchdog = setTimeout(() => {
      this.emit('offline')
    }, GATEWAY_HEARTBEAT_INTERVAL_MS * GATEWAY_HEARTBEAT_OFFLINE_RATIO)
  }

  _handleMessage (msg) {
    let sid
    let type
    let state
    switch (msg.cmd) {
      case 'get_id_list_ack':
        this._refreshKey(msg.token)

        const payload = `{"cmd": "read", "sid": "${this._sid}"}`
        this._sendUnicast(payload)
        // read subdevices
        for (const sid of JSON.parse(msg.data)) {
          const payload = `{"cmd": "read", "sid": "${sid}"}`
          this._sendUnicast(payload)
        }
        break
      case 'read_ack':
        sid = msg.sid
        type = msg.model
        state = JSON.parse(msg.data)

        if (sid === this._sid) { // self
          this._handleState(state)

          this._ready = true
          this.emit('ready')
        } else {
          let subdevice
          switch (type) {
            case 'magnet':
              subdevice = new Magnet({ sid })
              break
            case 'switch':
              subdevice = new Switch({ sid })
              break
            default:
              return false
          }

          if (subdevice) {
            this._subdevices.set(msg.sid, subdevice)
            subdevice._handleState(state)
            this.emit('subdevice', subdevice)
          }
        }
        break
      case 'heartbeat':
        if (msg.sid === this._sid) {
          this._refreshKey(msg.token)
          this._rearmWatchdog()
        }
        break
      case 'report':
        state = JSON.parse(msg.data)
        if (msg.sid === this._sid) this._handleState(state) // self
        else this._subdevices.get(msg.sid)._handleState(state)
        break
    }

    return true
  }

  _handleState (state) {
    const buf = Buffer.alloc(4)
    buf.writeUInt32BE(state.rgb, 0)
    this._color.r = buf.readUInt8(1)
    this._color.g = buf.readUInt8(2)
    this._color.b = buf.readUInt8(3)
    this._intensity = buf.readUInt8(0) // 0-100

    this.emit('lightState', { color: this._color, intensity: this._intensity })
  }

  _refreshKey (token) {
    if (token) this._token = token
    if (!this._password || !this._token) return

    const cipher = crypto.createCipheriv('aes-128-cbc', this._password, AQARA_IV)
    this._key = cipher.update(this._token, 'ascii', 'hex')
    cipher.final('hex') // useless
  }

  _writeColor () {
    const buf = Buffer.alloc(4)
    buf.writeUInt8(this._intensity, 0)
    buf.writeUInt8(this._color.r, 1)
    buf.writeUInt8(this._color.g, 2)
    buf.writeUInt8(this._color.b, 3)

    const value = buf.readUInt32BE(0)

    const payload = `{"cmd": "write", "model": "gateway", "sid": "${this._sid}", "short_id": 0, "data": "{\\"rgb\\":${value}, \\"key\\": \\"${this._key}\\"}"}`
    this._sendUnicast(payload)
  }

  get ip () { return this._ip }
  get sid () { return this._sid }
  get ready () { return this._ready }

  get password () { return this._password }
  setPassword (password) {
    this._password = password
    this._refreshKey()
  }

  get color () { return this._color }
  setColor (color) {
    if (!this._ready) return

    this._color = color
    this._writeColor()
  }

  get intensity () { return this._intensity }
  setIntensity (intensity) {
    if (!this._ready) return

    this._intensity = intensity
    this._writeColor()
  }
}

module.exports = Gateway

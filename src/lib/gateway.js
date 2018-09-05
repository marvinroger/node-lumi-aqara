const crypto = require('crypto')
const events = require('events')

const {AQARA_IV, GATEWAY_HEARTBEAT_INTERVAL_MS, GATEWAY_HEARTBEAT_OFFLINE_RATIO} = require('../constants')
const Magnet = require('./magnet')
const Switch = require('./switch')
const Motion = require('./motion')
const Sensor = require('./sensor')
const Leak = require('./leak')
const Cube = require('./cube')
const Smoke = require('./smoke')
const Vibration = require('./vibration')

class Gateway extends events.EventEmitter {
  constructor (opts) {
    super()

    this._ip = opts.ip
    this._sid = opts.sid
    this._sendUnicast = opts.sendUnicast

    this._heartbeatWatchdog = null
    this._rearmWatchdog()

    this._color = { r: 0, g: 0, b: 0 }

    this._sound = 10000
    this._volume = 0

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
            case 'sensor_magnet.aq2':
              subdevice = new Magnet({ sid })
              break
            case 'switch':
            case 'sensor_switch.aq2':
            subdevice = new Switch({ sid })
              break
            case 'motion':
            case 'sensor_motion.aq2':
              subdevice = new Motion({ sid })
              break
            case 'sensor_ht':
            case 'weather.v1':
              subdevice = new Sensor({ sid })
              break
            case 'sensor_wleak.aq1':
              subdevice = new Leak({ sid })
              break
            case 'cube':
            case 'sensor_cube.aqgl01':
              subdevice = new Cube({ sid })
              break
            case 'smoke':
              subdevice = new Smoke({ sid })
              break
            case 'vibration':
              subdevice = new Vibration({ sid })
              break
            default:
              return false
          }

          if (subdevice) {
            this._subdevices.set(msg.sid, subdevice)
            this.emit('subdevice', subdevice)
            subdevice._handleState(state)
            subdevice._offline = true
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
        if (msg.sid === this._sid) { this._handleState(state) }// self
        else {
          const subdevice = this._subdevices.get(msg.sid)
          if (subdevice) {
            subdevice._handleState(state)
          } else {
            // console.log('did not manage to find device, or device not yet supported')
          }
        }
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

  _writeSound () {

    const payload = `{"cmd": "write", "model": "gateway", "sid": "${this._sid}", "short_id": 0, "data": "{\\"mid\\":${this._sound}, \\"vol\\":${this._volume}, \\"key\\": \\"${this._key}\\"}"}`
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

  get sound () { return this._sound }
  get volume () { return this._volume }
  setSound (sound, volume) {
    if (!this._ready) return

    this._sound = sound
    this._volume = volume
    this._writeSound()
  }

  get intensity () { return this._intensity }
  setIntensity (intensity) {
    if (!this._ready) return

    this._intensity = intensity
    this._writeColor()
  }
}

module.exports = Gateway

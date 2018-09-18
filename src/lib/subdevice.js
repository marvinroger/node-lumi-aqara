const events = require('events')

const {SUBDEVICE_MAINS_HEARTBEAT_INTERVAL_MS, SUBDEVICE_MAINS_HEARTBEAT_OFFLINE_RATIO, SUBDEVICE_BATTERY_HEARTBEAT_INTERVAL_MS, SUBDEVICE_BATTERY_HEARTBEAT_OFFLINE_RATIO, SUBDEVICE_MIN_VOLT, SUBDEVICE_MAX_VOLT} = require('../constants')

class Subdevice extends events.EventEmitter {
  constructor (opts) {
    super()

    this._sid = opts.sid
    this._type = opts.type

    this._mains = opts.mains
    this._heartbeatWatchdog = null
    this._rearmWatchdog()
    this._offline = true

    this._voltage = null
  }

  _rearmWatchdog () {
    if (this._heartbeatWatchdog) clearTimeout(this._heartbeatWatchdog)
    this._heartbeatWatchdog = setTimeout(() => {
      if (!this._offline) {
        this.emit('offline')
        this._offline = true
      }
    }, this._mains ? SUBDEVICE_MAINS_HEARTBEAT_INTERVAL_MS * SUBDEVICE_MAINS_HEARTBEAT_OFFLINE_RATIO : SUBDEVICE_BATTERY_HEARTBEAT_INTERVAL_MS * SUBDEVICE_BATTERY_HEARTBEAT_OFFLINE_RATIO)
  }

  _handleState (state, initial) {
    this._cached = Boolean(initial)

    if (typeof state.voltage !== 'undefined') this._voltage = state.voltage
    if (!initial && this._offline) {
      this._offline = false
      this.emit('online')
    }
    this._rearmWatchdog()
  }

  getCached () {
    return this._cached
  }

  getSid () {
    return this._sid
  }

  getType () {
    return this._type
  }

  getBatteryVoltage () {
    return this._voltage
  }

  getBatteryPercentage () {
    let percentage = Math.round(((this._voltage - SUBDEVICE_MIN_VOLT) / (SUBDEVICE_MAX_VOLT - SUBDEVICE_MIN_VOLT)) * 100)
    if (percentage > 100) percentage = 100
    if (percentage < 0) percentage = 0
    return percentage
  }
}

module.exports = Subdevice

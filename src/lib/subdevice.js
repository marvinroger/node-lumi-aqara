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
    this._offline = null

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

  _heartbeat (state) {
    if (typeof state.voltage !== 'undefined') this._voltage = state.voltage

    if (this._offline !== false) {
      this._offline = false
      this.emit('online')
    }
    this._rearmWatchdog()
  }

  _handleState (state) {
    if (typeof state.voltage !== 'undefined') this._voltage = state.voltage

    this._cached = Boolean(state.cached)

    if (!state.cached && this._offline !== false) {
      this._offline = false
      this.emit('online')
    }
    this._rearmWatchdog()
  }

  getCached () {
    return this._cached
  }

  getOffline () {
    return this._offline
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

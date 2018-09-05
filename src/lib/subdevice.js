const events = require('events')

const {SUBDEVICE_MIN_VOLT, SUBDEVICE_MAX_VOLT} = require('../constants')

class Subdevice extends events.EventEmitter {
  constructor (opts) {
    super()

    this._sid = opts.sid
    this._type = opts.type

    this._voltage = null
  }

  _handleState (state) {
    if (typeof state.voltage !== 'undefined') this._voltage = state.voltage
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

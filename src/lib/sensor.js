const Subdevice = require('./subdevice')

class Sensor extends Subdevice {
  constructor (opts) {
    super({ sid: opts.sid, type: 'sensor' })

    this._temperature = null
    this._humidity = null
  }

  _handleState (state) {
    super._handleState(state)

    // all fields come at once at first but one-by-one later
    if (state.temperature) {
      this._temperature = state.temperature / 100
    }
    if (state.humidity) {
      this._humidity = state.humidity / 100
    }

    if (this._timeout) {
      clearTimeout(this._timeout)
    }

    this._timeout = setTimeout(() => {
      this.emit('update')
      this._timeout = null
    }, 25)

  }

  getTemperature () {
    return this._temperature
  }
  getHumidity () {
    return this._humidity
  }
}

module.exports = Sensor

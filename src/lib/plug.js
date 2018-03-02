const Subdevice = require('./subdevice')

class Plug extends Subdevice {
  constructor (opts) {
    super({ sid: opts.sid, type: 'plug' })

    this._short_id = opts.short_id
    this._status = 'off'
    this._power_consumed = 0
    this._load_power = 0
  }

  _handleState (state) {
    super._handleState(state)

    if (typeof state.status === 'undefined') return // might be no_close
    
    this._status = state.status
    
    if (state.power_consumed) this._power_consumed = state.power_consumed
    if (state.load_power) this._load_power = state.load_power
    
    if(typeof state.load_power === 'undefined') {
      this.emit(state.status)
    } else {
      this.emit('update')
    }
  }

  getBatteryPercentage () {
    return 100
  }

  getPowerConsumed () {
    return this._power_consumed
  }

  getLoadPower () {
    return this._load_power
  }

  isOn () {
    return this._status === 'on'
  }
}

module.exports = Plug

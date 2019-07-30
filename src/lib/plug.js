const Subdevice = require('./subdevice')

class Plug extends Subdevice {
  constructor (opts, sendUnicast) {
    super({ sid: opts.sid, type: 'plug' })

    this._sendUnicast = sendUnicast
  }

  _handleState (state) {
    super._handleState(state)

    if (state.status) {
      this._on = state.status === 'on'

      this.emit('power', this._on)
    }

    if (state.inuse) {
      this._inuse = state.inuse
    }

    if (state.power_consumed) {
      this._powerConsumed = parseInt(state.power_consumed, 10)
      this.emit('powerConsumed', this._powerConsumed)
    }

    if (state.load_power) {
      this._loadPower = parseFloat(state.load_power)
      this.emit('loadPower', this._loadPower)
    }

    if (this._timeout) {
      clearTimeout(this._timeout)
    }

    this._timeout = setTimeout(() => {
      this.emit('update')
      this._timeout = null
    }, 25)
  }

  isOn() {
    return this._on
  }

  getInUse() {
    return this._inuse
  }

  getPowerConsumed() {
    return this._powerConsumed
  }

  getLoadPower() {
    return this._loadPower
  }

  togglePower(force) {
    const power = typeof force === 'undefined'
      ? !this.isOn()
      : !!force

    this._sendUnicast({
      cmd: 'write',
      data: {
        status: power ? 'on' : 'off'
      }
    })
  }

  turnOn() {
    this.togglePower(true)
  }

  turnOff() {
    this.togglePower(false)
  }
}

module.exports = Plug

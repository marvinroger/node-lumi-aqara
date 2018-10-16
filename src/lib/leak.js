const Subdevice = require('./subdevice')

class Leak extends Subdevice {
  constructor (opts) {
    super({ sid: opts.sid, type: 'leak' })

    this._leaking = null
  }

  _handleState (state) {
    super._handleState(state)

    // possible state values are: leak, no_leak, iam
    // iam is emitted when the sensor is squeezed and should not affect the state
    if (state.status === 'leak') this._leaking = true
    else this._leaking = false

    this.emit('update')
  }

  isLeaking () {
    return this._leaking
  }
}

module.exports = Leak

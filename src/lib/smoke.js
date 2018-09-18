const Subdevice = require('./subdevice')

class Smoke extends Subdevice {
  constructor (opts) {
    super({ sid: opts.sid, type: 'smoke' })

    this._alarm = null
    this._density = null
  }

  _handleState (state, initial) {
    super._handleState(state, initial)

    if ('alarm' in state) this._alarm = state.alarm !== '0'
    if ('density' in state) this._density = state.density;

    this.emit('update')
  }

  hasAlarm () {
    return this._alarm
  }
  getDensity () {
    return this._density
  }
}

module.exports = Smoke

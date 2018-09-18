const Subdevice = require('./subdevice')

class Cube extends Subdevice {
  constructor (opts) {
    super({ sid: opts.sid, type: 'cube' })

    this._status = null
    this._rotateDegrees = null
  }

  _handleState (state, initial) {
    super._handleState(state, initial)

    if ('rotate' in state) {
      this._status = 'rotate'
      this._rotateDegrees = state.rotate
    } else {
      this._status = state.status
      this._rotateDegrees = null
    }

    this.emit('update')

  }

  getStatus () {
    return this._status
  }
  getRotateDegrees () {
    return this._rotateDegrees
  }
}

module.exports = Cube

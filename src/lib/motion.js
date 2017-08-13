const Subdevice = require('./subdevice')

class Motion extends Subdevice {
  constructor (opts) {
    super({ sid: opts.sid, type: 'motion' })
  }

  _handleState (state) {
    super._handleState(state)

    // when motion is detected then json contains only 'status' field with this specific value
    this._motion = state.status === 'motion'
    // in case of inactivity, json contains only 'no_motion' field
    // with seconds from last motion as the value (reports '120', '180', '300', '600', '1200' and finally '1800')
    this._seconds = state.no_motion

    if (this._motion) this.emit('motion')
    else if (state.no_motion) this.emit('noMotion')

  }

  hasMotion () {
    return this._motion
  }
  getSecondsSinceMotion () {
    return this._seconds
  }
}

module.exports = Motion

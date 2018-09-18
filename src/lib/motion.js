const Subdevice = require('./subdevice')

class Motion extends Subdevice {
  constructor (opts) {
    super({ sid: opts.sid, type: 'motion' })

    this._motion = null
    this._lux = null
    this._seconds = null
  }

  _handleState (state, initial) {
    super._handleState(state, initial)

    // message with lux value comes separately and seems to arrive before motion messages
    if (state.lux) this._lux = state.lux

    if ('status' in state || 'no_motion' in state) {
      // when motion is detected then json contains only 'status' field with this specific value
      this._motion = state.status === 'motion'
      // in case of inactivity, json contains only 'no_motion' field
      // with seconds from last motion as the value (reports '120', '180', '300', '600', '1200' and finally '1800')
      this._seconds = state.no_motion

      if (this._motion) this.emit('motion')
      else if (state.no_motion) this.emit('noMotion')
    }
  }

  hasMotion () {
    return this._motion
  }
  getLux () {
    return this._lux
  }
  getSecondsSinceMotion () {
    return this._seconds
  }
}

module.exports = Motion

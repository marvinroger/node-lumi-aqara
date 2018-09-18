const Subdevice = require('./subdevice')

class Vibration extends Subdevice {
  constructor (opts) {
    super({ sid: opts.sid, type: 'vibration' })


  }

  _handleState (state, initial) {
    super._handleState(state, initial)

    if ('status' in state) {
      // status can be "vibrate", "tilt", "free_fall". "tilt" is always followed by a "final_tilt_angel" state
      switch (state.status) {
        case 'free_fall':
          this.emit('freeFall')
          break
        case 'vibrate':
          this.emit('vibrate')
          break
      }
    } else if ('final_tilt_angle' in state) {
      this._finalTiltAngel = state.final_tilt_angle
      this.emit('tilt')
    } else if ('coordination' in state) {
      this._coordination = state.coordination
      this.emit('update')
    } else if ('bed_activity' in state) {
      this._bedActivity = state.bed_activity
      this.emit('update')
    }
  }

  getStatus () {
    return this._status
  }
  getFinalTiltAngel () {
    return this._finalTiltAngel
  }
  getCoordination () {
    return this._coordination
  }
  getBedActivity () {
    return this._bedActivity
  }
}

module.exports = Vibration

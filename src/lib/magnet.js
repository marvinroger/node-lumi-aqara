const Subdevice = require('./subdevice')

class Magnet extends Subdevice {
  constructor (opts) {
    super({ sid: opts.sid, type: 'magnet' })

    this._open = null
  }

  _handleState (state) {
    super._handleState(state)

    if (typeof state.status === 'undefined') return // might be no_close

    this._open = state.status === 'open'

    if (this._open) this.emit('open')
    else this.emit('close')
  }

  isOpen () {
    return this._open
  }
}

module.exports = Magnet

const Subdevice = require('./subdevice')

class Leak extends Subdevice {
  constructor (opts) {
    super({ sid: opts.sid, type: 'leak' })
  }

  _handleState (state) {
    super._handleState(state)

    if (typeof state.status === 'undefined') return

    switch (state.status) {
      case 'leak':
        this.emit('leak')
        break
      case 'no_leak':
        this.emit('noLeak')
        break
    }
  }
}

module.exports = Leak

const Subdevice = require('./subdevice')

class Switch extends Subdevice {
  constructor (opts) {
    super({ sid: opts.sid, type: 'switch' })
  }

  _handleState (state, initial) {
    super._handleState(state, initial)

    if (typeof state.status === 'undefined') return // might be no_close

    switch (state.status) {
      case 'click':
        this.emit('click')
        break
      case 'double_click':
        this.emit('doubleClick')
        break
      case 'long_click_press':
        this.emit('longClickPress')
        break
      case 'long_click_release':
        this.emit('longClickRelease')
        break
    }
  }
}

module.exports = Switch

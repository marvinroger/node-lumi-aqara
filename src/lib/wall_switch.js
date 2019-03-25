const Subdevice = require('./subdevice')

class WallSwitch extends Subdevice {
  constructor (opts) {
    super({ sid: opts.sid, type: 'wall_switch' })

    this._switchChannel = null
  }

  _handleState (state) {
    super._handleState(state)

    // there are probably better ways to do this, but this works for now.
    if (!this._handleChannel(state, 0)) this._handleChannel(state, 1)
  }

  _handleChannel(state, switchChannel) {
    if (typeof state["channel_" + switchChannel] === 'undefined') return // might be no_close

    this._switchChannel = switchChannel

    switch (state["channel_" + switchChannel]) {
      case 'click':
        this.emit('click')
        break
      case 'double_click':
        this.emit('doubleClick')
        break
      case 'long_click':
        this.emit('longClick')
        break
    }

    return switchChannel;
  }

  getChannel() {
    return this._switchChannel
  }
}

module.exports = WallSwitch

const dgram = require('dgram')
const os = require('os')
const events = require('events')

const {MULTICAST_ADDRESS, DISCOVERY_PORT, SERVER_PORT} = require('./constants')
const Gateway = require('./lib/gateway')

class Aqara extends events.EventEmitter {
  constructor (options) {
    super()

    this._options = {
      bindHost: '0.0.0.0',
      unbindHosts: []
    };

    if(options && options.bindHost) {
      this._options.bindHost = options.bindHost;
    }

    if(options && options.unbindHosts) {
      this._options.unbindHosts = Array.isArray(options.unbindHosts)? options.unbindHosts : [];
    }


    this._gateways = new Map()

    this._serverSocket = dgram.createSocket('udp4')
    this._serverSocket.on('listening', () => {
      const networkIfaces = os.networkInterfaces()
      for (const ifaceName in networkIfaces) {
        const networkIface = networkIfaces[ifaceName]

        for (const connection of networkIface) {
          if (connection.family === 'IPv4') {
            if(this._options.unbindHosts.indexOf(connection.address) === -1) {
              this._serverSocket.addMembership(MULTICAST_ADDRESS, connection.address)
            }
          }
        }
      }

      this._triggerWhois()
    });

    this._serverSocket.on('message', this._handleMessage.bind(this))

    this._serverSocket.bind(SERVER_PORT, this._options.bindHost);
  }

  _triggerWhois () {
    const payload = '{"cmd": "whois"}'
    this._serverSocket.send(payload, 0, payload.length, DISCOVERY_PORT, MULTICAST_ADDRESS)
  }

  _handleMessage (msg) {
    msg = msg.toString()
    this.emit('debug', msg)
    const parsed = JSON.parse(msg)

    let handled = false

    switch (parsed.cmd) {
      case 'heartbeat':
        if (parsed.model === 'gateway' && !this._gateways.has(parsed.sid)) {
          handled = true
          this._triggerWhois()
        }
        break
      case 'iam':
        handled = true
        if (this._gateways.has(parsed.sid)) break
        const gateway = new Gateway({
          ip: parsed.ip,
          sid: parsed.sid,
          sendUnicast: (payload) => this._serverSocket.send(payload, 0, payload.length, SERVER_PORT, parsed.ip)
        })
        gateway.on('offline', () => this._gateways.delete(parsed.sid))
        this._gateways.set(parsed.sid, gateway)
        this.emit('gateway', gateway)
        break
    }

    if (!handled) { // propagate to gateways
      for (const gateway of this._gateways.values()) {
        handled = gateway._handleMessage(parsed)
        if (handled) break
      }
    }

    if (!handled) console.log(`not handled: ${JSON.stringify(parsed)}`)
  }
}

module.exports = Aqara

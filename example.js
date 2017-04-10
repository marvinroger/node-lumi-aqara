const LumiDiscoverer = require('./src')

const lumi = new LumiDiscoverer()
lumi.on('gateway', (gateway) => {
  console.log('Gateway discovered')
  gateway.on('ready', () => {
    console.log('Gateway is ready')
    gateway.setPassword('sotxcen2i4otuj7z')
    gateway.setColor({ r: 255, g: 0, b: 0 })
    gateway.setIntensity(100)
  })

  gateway.on('offline', () => {
    console.log('Gateway is offline')
  })

  gateway.on('subdevice', (device) => {
    console.log('New device')
    console.log(`  Battery: ${device.getBatteryPercentage()}%`)
    console.log(`  Type: ${device.getType()}`)
    console.log(`  SID: ${device.getSid()}`)
    switch (device.getType()) {
      case 'magnet':
        console.log(`  Magnet (${device.isOpen() ? 'open' : 'close'})`)
        device.on('open', () => {
          console.log(`${device.getSid()} is now open`)
        })
        device.on('close', () => {
          console.log(`${device.getSid()} is now close`)
        })
        break
      case 'switch':
        console.log(`  Switch`)
        device.on('click', () => {
          console.log(`${device.getSid()} is clicked`)
        })
        device.on('doubleClick', () => {
          console.log(`${device.getSid()} is double clicked`)
        })
        device.on('longClickPress', () => {
          console.log(`${device.getSid()} is long pressed`)
        })
        device.on('longClickRelease', () => {
          console.log(`${device.getSid()} is long released`)
        })
        break
    }
  })

  gateway.on('lightState', (state) => {
    console.log(`Light updated: ${JSON.stringify(state)}`)
  })
})

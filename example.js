const Aqara = require('./src')

const aqara = new Aqara()
aqara.on('gateway', (gateway) => {
  console.log('Gateway discovered')
  gateway.on('ready', () => {
    console.log('Gateway is ready')
    gateway.setPassword('sotxcen2i4otuj7z')
    gateway.setColor({ r: 255, g: 0, b: 0 })
    gateway.setIntensity(100)
    gateway.setSound(11,50) // 11 : Knock at the door | 50 : volume (0-100)
  })

  gateway.on('offline', () => {
    gateway = null
    console.log('Gateway is offline')
  })

  gateway.on('subdevice', (device) => {
    console.log('New device')
    console.log(`  Battery: ${device.getBatteryPercentage()}%`)
    console.log(`  Type: ${device.getType()}`)
    console.log(`  SID: ${device.getSid()}`)

    console.log("Testing type", device.getType())

    switch (device.getType()) {
      case 'magnet':
        console.log(`  Magnet (${device.isOpen() ? 'open' : 'close'})`)
        device.on('open', () => {
          console.log(`${device.getSid()} is now open`)
        })
        device.on('close', () => {
          console.log(`${device.getSid()} is now close`)
        })
        device.on('offline', () => {
          console.log(`${device.getSid()} is offline`)
        })
        device.on('online', () => {
          console.log(`${device.getSid()} is online`)
        })
        break
      case 'wall_switch':
        console.log(`  Wall Switch`)
        device.on('click', () => {
          console.log(`${device.getSid()} is clicked on channel ${device.getChannel()}`)
        })
        device.on('doubleClick', () => {
          console.log(`${device.getSid()} is double clicked on channel ${device.getChannel()}`)
        })
        device.on('longClick', () => {
          console.log(`${device.getSid()} is long pressed on channel ${device.getChannel()}`)
        })
        break;
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
      case 'motion':
        console.log(`  Motion (${device.hasMotion() ? 'motion' : 'no motion'})`)
        device.on('motion', () => {
          console.log(`${device.getSid()} has motion${device.getLux() !== null ? ' (lux:' + device.getLux() + ')' : ''}`)
        })
        device.on('noMotion', () => {
          console.log(`${device.getSid()} has no motion (inactive:${device.getSecondsSinceMotion()}${device.getLux() !== null ? ' lux:' + device.getLux() : ''})`)
        })
        break
      case 'sensor':
        console.log(`  Sensor (temperature:${device.getTemperature()}C rh:${device.getHumidity()}%${device.getPressure() != null ? ' pressure:' + device.getPressure() + 'kPa': ''})`)
        device.on('update', () => {
          console.log(`${device.getSid()} temperature: ${device.getTemperature()}C rh:${device.getHumidity()}%${device.getPressure() != null ? ' pressure:' + device.getPressure() + 'kPa' : ''}`)
        })
        break
      case 'leak':
        console.log(`  Leak sensor`)
        device.on('update', () => {
          console.log(`${device.getSid()}${device.isLeaking() ? '' : ' not'} leaking`)
        })
        break
      case 'cube':
        console.log(`  Cube`)
        device.on('update', () => {
          console.log(`${device.getSid()} ${device.getStatus()}${device.getRotateDegrees() !== null ? ' ' + device.getRotateDegrees() : ''}`)
        })
        break
      case 'smoke':
        console.log(`  Smoke`)
        device.on('update', () => {
          console.log(`${device.getSid()} (${device.hasAlarm() ? 'SMOKE DETECTED' : 'no smoke detected'} density: ${device.getDensity()})`)
        })
        break
      case 'vibration':
        console.log(`  Vibration`)
        device.on('update', () => {
          console.log(`${device.getSid()} (coordination: ${device.getCoordination()} bed_activity: ${device.getBedActivity()})`)
        })
        device.on('vibrate', () => {
          console.log(`${device.getSid()} has vibration`)
        })
        device.on('freeFall', () => {
          console.log(`${device.getSid()} has freeFall`)
        })
        device.on('tilt', () => {
          console.log(`${device.getSid()} (tilt: ${device.getFinalTiltAngel()}°)`)
        })
        break;
    }
  })

  gateway.on('lightState', (state) => {
    console.log(`Light updated: ${JSON.stringify(state)}`)
  })
})

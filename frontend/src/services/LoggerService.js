class LoggerService {
  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development'
  }

  log(level, message, data = null) {
    if (this.isDevelopment) {
      this.logToConsole(level, message, data)
    }
  }

  logToConsole(level, message, data) {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    const logData = data !== null && data !== undefined ? data : ''

    switch (level) {
      case 'error':
        console.error(prefix, message, logData)
        break
      case 'warn':
        console.warn(prefix, message, logData)
        break
      case 'info':
        console.info(prefix, message, logData)
        break
      default:
        console.log(prefix, message, logData)
    }
  }

  error(message, data) { this.log('error', message, data) }
  warn(message, data) { this.log('warn', message, data) }
  info(message, data) { this.log('info', message, data) }
  debug(message, data) { this.log('debug', message, data) }
}

export default new LoggerService()
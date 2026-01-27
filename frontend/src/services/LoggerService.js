class LoggerService {
  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development'
    this.logQueue = []
    this.isOnline = navigator.onLine
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushLogs()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  log(level, message, data = null) {
    const logEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    // Always log to console in development
    if (this.isDevelopment) {
      this.logToConsole(level, message, data)
    }

    // Queue log for sending to backend
    this.queueLog(logEntry)
  }

  // In the logToConsole method, update the data handling:
  logToConsole(level, message, data) {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    // Only log data if it's not null/undefined
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
      case 'debug':
        console.log(prefix, message, logData)
        break
      default:
        console.log(prefix, message, logData)
    }
  }

  queueLog(logEntry) {
    this.logQueue.push(logEntry)
    
    // Send logs immediately if online and not in development
    if (this.isOnline && !this.isDevelopment) {
      this.flushLogs()
    }
    
    // Keep queue size manageable
    if (this.logQueue.length > 100) {
      this.logQueue = this.logQueue.slice(-50)
    }
  }

  async flushLogs() {
    if (this.logQueue.length === 0) return
    
    const logsToSend = [...this.logQueue]
    this.logQueue = []
    
    try {
      // Send logs to backend (you'll need to create this endpoint)
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs: logsToSend })
      })
    } catch (error) {
      // If sending fails, put logs back in queue
      this.logQueue.unshift(...logsToSend)
      console.error('Failed to send logs to backend:', error)
    }
  }

  // Convenience methods
  error(message, data) {
    this.log('error', message, data)
  }

  warn(message, data) {
    this.log('warn', message, data)
  }

  info(message, data) {
    this.log('info', message, data)
  }

  debug(message, data) {
    this.log('debug', message, data)
  }
}

export default new LoggerService()
import logger from '../services/LoggerService'

export function setupErrorHandling(app) {
  // Vue error handler
  app.config.errorHandler = (err, instance, info) => {
    logger.error('Vue Error', {
      error: err.message,
      stack: err.stack,
      info,
      component: instance?.$options.name || 'Unknown'
    })
  }

  // Global unhandled promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', {
      reason: event.reason,
      promise: event.promise
    })
  })

  // Global error handler
  window.addEventListener('error', (event) => {
    logger.error('Global Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    })
  })
}
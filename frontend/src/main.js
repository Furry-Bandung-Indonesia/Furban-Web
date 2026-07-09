// v3 - guaranteed cache bust
console.log(`           ++++      ++++           
          ++++++    ++++++          
         ++++++++  ++++++++         
         ++++++++  ++++++++         
         +++++++++++++++++++        
     ++++++++++++++++++++++++++     
    +++++++++++++  +++++++++++++    
    +++++++  +  +==+  +   ++++++    
    +++++++  ++++==++++  +++++++    
    +++++++ +++++==+++++ +++++++    
     ++++ +++++++=-+++++++ ++++     
        ++++++++::::++++++++        
       +++----------------=++       
       +---..............---+       
       +=..==============..=+       
        +++: =. =  = .= :+++        
          +: =.      .= .+          
                                    `)
console.log('Furban site build version july 2026')
console.log('our github project : https://github.com/Furry-Bandung-Indonesia')
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { setupErrorHandling } from './plugins/errorHandler'
import logger from './services/LoggerService'
import './style.css'

// Add this before mounting the app:
// Defensive check for browser extension conflicts
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error
  console.error = function (...args) {
    // Filter out known browser extension errors
    if (args[0] && typeof args[0] === 'string' &&
      args[0].includes('cssRules') &&
      args[0].includes('content.js')) {
      return // Ignore this specific error
    }
    originalConsoleError.apply(console, args)
  }
}

const app = createApp(App)

// Setup error handling
setupErrorHandling(app)

app.use(createPinia())
app.use(router)
app.use(i18n)  // Add this line to register vue-i18n

// Make logger available globally
app.config.globalProperties.$logger = logger

logger.info('Application starting')

app.mount('#app')

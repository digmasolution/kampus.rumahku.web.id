import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { installInterceptors } from './hooks/useFeedbackContext'

// Pasang interceptor XHR/fetch/console SEBELUM React render
// agar semua network call & log dari awal sesi browser tertangkap
installInterceptors()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

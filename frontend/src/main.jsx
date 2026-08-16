import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import UIRoot from './UIRoot.jsx'
import './ui.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      <App />
      <UIRoot />
    </>
  </StrictMode>,
)

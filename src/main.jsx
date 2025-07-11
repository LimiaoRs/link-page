import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './ThemeContext.jsx'  // 这行必须有
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>  {/* 这个包装必须有 */}
      <App />
    </ThemeProvider>
  </StrictMode>,
)
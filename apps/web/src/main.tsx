import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import './style.css'
document.documentElement.dataset.theme = localStorage.getItem('theme') || ''
document.documentElement.style.setProperty('--fs', localStorage.getItem('fs') || '1')
createRoot(document.getElementById('root')!).render(<ErrorBoundary><App /></ErrorBoundary>)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 簡單的 CSS reset，確保 Tailwind 正常運作
const style = document.createElement('style');
style.innerHTML = `
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 隱藏捲軸但保留功能 */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
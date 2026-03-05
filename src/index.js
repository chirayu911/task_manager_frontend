import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext'; // ⭐ Ensure this import path is correct

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  
    <BrowserRouter>
      {/* ⭐ The Provider MUST wrap the App component */}
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  
);